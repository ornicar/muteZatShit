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
      var timeDomain = new Uint8Array(analyser.frequencyBinCount);
      analyser.getFloatFrequencyData(freqDomain);
      analyser.getByteTimeDomainData(timeDomain);

      var volume = getPower(timeDomain);
      var voicePower = getVoicePower(freqDomain);
      self.trigger("probability", freqDomain);
    }, 2000)
  }
});

// array: audio sample
function getPower(array) {
  var length = array.length;
  var v = 0;
  for(var i = 0; i < length; i++) {
    var d = array[i];
    v += d * d;
  }
  console.log("volume", v);
  return v;
}

// array: frequency
// frequency speech : 80 Hz-> 8000Hz
function getVoicePower(array) {
  var length = array.length; // 1024
  var cutIndex = Math.ceil(length * 8000 / 22050); // we have a frequency resolution of 21.5Hz
  var startIndex = Math.floor(length * 80 / 22050);
  var p = 0;
  for(var i = startIndex; i < cutIndex; i++) {
    var d = array[i];
    p += d * d;
  }
  return p;
}

function getEnergyBalance(array) {
  var length = array.length; // 1024
  var cutIndex = Math.ceil(length * 8000 / 22050); // we have a frequency resolution of 21.5Hz
  var startIndex = Math.floor(length * 80 / 22050);
  var b = 0;

  var notVoice = 0;
  var voice = 0;
  for(var i = 0; i< startIndex; i++) {
    notVoice += array[i];
  }
  for(var i = cutIndex; i< length; i++) {
    notVoice += array[i];
  }
  for(var i = startIndex; i < cutIndex; i++) {
    voice += array[i];
  }
  return notVoice/voice;
}

module.exports = ee;