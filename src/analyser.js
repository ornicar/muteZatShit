var _ = require("underscore");
var BackboneEvents = require("backbone-events-standalone");

var ee = BackboneEvents.mixin({
  setAnalyserNode: function(analyserNode) {
    this.analyser = analyserNode;
  },
  start: function() {
    var self = this;
    var analyser = self.analyser;
    setInterval(function() {
      var freqDomain = new Float32Array(analyser.frequencyBinCount);
      var timeDomain = new Float32Array(analyser.frequencyBinCount);
      analyser.getFloatFrequencyData(freqDomain);
      analyser.getByteTimeDomainData(timeDomain);
      self.trigger("probability", timeDomain)
    }, 2000)
  }
});

module.exports = ee;