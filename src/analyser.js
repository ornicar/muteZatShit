var _ = require("underscore");
var BackboneEvents = require("backbone-events-standalone");

var ee = BackboneEvents.mixin({
  setAnalyserNode: function(analyserNode) {
    this.analyser = analyserNode;
  },
  start: function() {
    var self = this;
    var analyser = self.analyser;
    var concatNb = 0;
    var positive = 0;
    var negative = 0;

    var timeArray = [];
    var freqArray = [];

    var ACQUISITION = 100;
    var NUMBER_POSITIVE_FLAG = 1;
    var NUMBER_NEGATIVE_FLAG = 2;

    var isNowAd = false;

    setInterval(function() {
      var freqDomain = new Uint8Array(analyser.frequencyBinCount);
      var timeDomain = new Uint8Array(analyser.frequencyBinCount);

      analyser.getByteFrequencyData(freqDomain);
      analyser.getByteTimeDomainData(timeDomain);
      var normalizedFreqDomain = _.map(freqDomain, function(v) {return v / 256;});
      var normalizedTimeDomain = _.map(timeDomain, function(v) {return (v-128)/128;});
      // console.log("time", normalizedTimeDomain);
      // console.log("freq", normalizedFreqDomain);
      if (concatNb < ACQUISITION) {
        for (var i = 0; i < normalizedTimeDomain.length; i++) {
          timeArray.push(normalizedTimeDomain[i]);
        }
        freqArray.push(normalizedFreqDomain);
        concatNb++;
      } else {
        var averageFreq = [];
        for (var i = 0; i < analyser.frequencyBinCount; i++) {
          var sum = 0;
          for (var j = 0; j < freqArray.length; j++) {
            sum = sum + freqArray[j][i];
          }
          averageFreq[i] = sum / freqArray.length; 
        }
        var volume = getPower(timeArray);
        var energyBalance = getEnergyBalance(averageFreq);
        var numberExtremeFreq = getNumberExtremeFrequency(averageFreq);
        var voicePower = getVoicePower(averageFreq);
        var spectral = spectralFlux(freqArray);

        var info = {"volume": volume, "energyBalance": energyBalance, 
                "numberExtremeFreq": numberExtremeFreq, "voicePower": voicePower, "spectral":spectral};
        console.log(info);
        var isAd = decisionTree(info);
        if (isAd) {
          positive++;
          if (positive >= NUMBER_POSITIVE_FLAG) {
            console.log(positive);
            negative = NUMBER_NEGATIVE_FLAG;
            if (!isNowAd) {
              self.trigger("beginAd");
            }
            isNowAd = true;
          } 
        } else {
          negative--;
          if (negative == 0) {
            self.trigger("endAd");
            isNowAd = false;
          } else {
            positive = 0;
          }
        }
        concatNb = 0;
        timeArray = [];
        freqArray = [];
      }
    }, 20);
  }
});

//isAd
function decisionTree(info) {
  if (info.volume > 51) {
    return false;
  } else {
    if (info.voicePower < 75) {
      return false;
    } else {
      return true;
    }
  }
}

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
    p += d;
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

// array frequency
function getNumberExtremeFrequency(array) {
  var average = 0;
  var length = array.length;
  for(var i =0; i < length; i++) {
    average += array[i];
  }
  average = average / length;

  var extreme = 0;
  var min = average * 0.2;
  var max = average * 3;
  for(var i = 0; i< length; i++) {
    var freq = array[i];
    if (freq < min || freq > max ) {
      extreme ++;
    }
  }
  return extreme;
}

// array of sample of freq
function spectralFlux(samples) {
  // sum of the dist for a freq between samples:
  var sampleLenght = samples.length;
  var sample = samples[0];
  var length = sample.length;
  var f = 0;
  for (var i = 0; i < length; i++) {
    for (var j = 1; j < sampleLenght; j++) {
      f += Math.abs(samples[j-1][i] - samples[j][i]);
    }
  }
  return f;
}

function meanFrequency(frequencies) {
  var m = 0;
  var weight = 0;
  var length = frequencies.length;
  for (var i = 0; i < length; i++) {
    var p = frequencies[i];
    var freq = i * 22050 / length;
    m += freq * p;
    weight += p;
  }
  return m / weight;
}

module.exports = ee;
