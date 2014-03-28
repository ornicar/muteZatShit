var Backbone = require("backbone");
var _ = require("underscore");
var $ = require("jquery");
Backbone.$ = $;

var NOTES = (function () {
  var notes = {};
  var toneSymbols = "CcDdEFfGgAaB";
  function noteToFrequency (note) {
    return Math.pow(2, (note-69)/12)*440;
  };
  for (var octave = 0; octave <= 10; ++octave) {
    for (var t = 0; t < 12; ++t) {
      notes[octave*12+t] = notes[toneSymbols[t]+octave] = noteToFrequency(octave * 12 + t);
    }
  }
  return notes;
}());

function noteEnvelope (gainNode, time, volume, a, d, s, r) {
  var ctx = gainNode.context;
  var gain = gainNode.gain;
  gain.value = 0;
  gain.cancelScheduledValues(0);
  gain.setValueAtTime(0, time);
  gain.linearRampToValueAtTime(volume, time + a);
  gain.linearRampToValueAtTime(volume * s, time + a + d);
  return function (t) {
    gain.cancelScheduledValues(0);
    gain.setValueAtTime(gain.value, t);
    gain.linearRampToValueAtTime(0, t + r);
    return Q.delay(1000*(0.1 + (t+r) - ctx.currentTime));
  };
}


  function Noise (ctx) {
    var bufferSize = 2 * ctx.sampleRate,
    noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate),
    output = noiseBuffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    var whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    var gain = ctx.createGain();
    whiteNoise.connect(gain);

    var filter = ctx.createBiquadFilter();
    gain.connect(filter);
    filter.type = "lowpass";

    this.white = whiteNoise;
    this.gain = gain;
    this.out = this.filter = filter;
  }

var createDivHere = (function (i) {
  return function () {
    var nodeid = "div_"+(i++);
    document.write('<div id="'+nodeid+'"></div>');
    return document.getElementById(nodeid);
  };
}(1));

var hookRevealJS = function (f, noSourceCode) {
  var div = createDivHere();
  if (!noSourceCode) addToggleSourceCode();
  var parents = $(div).parents("section");
  var currentSectionH = parents.last().prevAll("section").size();
  var currentSectionV = parents.size()<=1 ? 0 : $(div).parents("section").first().prevAll("section").size();
  
  function addToggleSourceCode () {
    var d = $(div);
    var toggle = $('<a href="#" class="toggle-source">Toggle Source Code</a>');
    var sc = $('<pre style="clear:both"></pre>');
    var code = $('<code data-trim />').html(f.toString()).appendTo(sc);
    toggle.on("click", function (e) {
      e.preventDefault();
      if (sc.is(":visible")) {
        d.show();
        sc.hide();
      }
      else {
        d.hide();
        sc.show();
      }
    });
    sc.hide();
    d.after(sc);
    d.after(toggle);
  }
  
  $(function(){
    var end;
    var lastH, lastV;
    function syncIndices (h, v) {
      if (h===lastH && v===lastV) return;
      lastH = h;
      lastV = v;
      if (end) {
        end.resolve();
        end = null;
      }
      if (h === currentSectionH && v === currentSectionV) {
        end = Q.defer();
        f(div, end.promise);
        Reveal.layout();
      }
    }
    Reveal.addEventListener('slidechanged', function(event) {
      syncIndices(event.indexh, event.indexv);
    });
    Reveal.addEventListener('ready', function () {
      var indices = Reveal.getIndices();
      syncIndices(indices.h, indices.v);
    });
  });
};

/*function syncStream(data){ // should be done by api itself. and hopefully will.
  var buf8 = new Uint8Array(data.buf); 
  buf8.indexOf = Array.prototype.indexOf;
  var i = data.sync, b = buf8;
  while(1) {
    data.retry++;
    i = b.indexOf(0xFF,i); if(i == -1 || (b[i+1] & 0xE0 == 0xE0 )) break;
    i++;
  }
  if(i!=-1) {
    var tmp = data.buf.slice(i); //carefull there it returns copy
    delete(data.buf); data.buf = null;
    data.buf = tmp;
    data.sync = i;
    return true;
  }
  return false;
}

function decode(ctx, d, data) {
  try{
    ctx.decodeAudioData(data.buf,
      function(decoded){
        d.resolve(b);
      },
      function(e){ // only on error attempt to sync on frame boundary
        if(syncStream(data)) decode(ctx, d, data);
      }
    );
  } catch(e) {
    console.log('decode exception',e.message);
  }
}*/

function loadSound (ctx, url) {
  var d = Q.defer();
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  request.addEventListener('load', bufferSound, false);

  function bufferSound(event) {
    var request = event.target;
    ctx.decodeAudioData(request.response, function(b) {
      d.resolve(b);
    }, function(e){
      d.reject(e);
    });
    /*var source = myAudioContext.createBufferSource();
    source.buffer = myAudioContext.createBuffer(request.response, false);
    mySource = source;*/
  }
  
  /*request.onload = function() {
    var data = {};
    data.buf = request.response;
    data.sync = 0;
    data.retry = 0;
    decode(ctx, d, data);

    ctx.decodeAudioData(request.response, function(b) {
      d.resolve(b);
    }, function(e){
      d.reject(e);
    });
  };*/

  request.onerror = function(e) {
    d.reject(e);
  };
  request.send();
  return d.promise;
}

/*function loadSound (ctx, url) {
  var d = Q.defer();
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  //request.onreadystatechange = handler;
  request.responseType = 'arraybuffer';

  function handler(evtXHR)
  {
    if (request.readyState == 4)
    {
      if (request.status == 302)
      {
        alert("REQUEST CORS");
        ctx.decodeAudioData(request.response, function(b) {
          d.resolve(b);
        }, function(e){
          d.reject(e);
        });
      }
      else
      {
        alert("Invocation Errors Occured");
      }
    }
  }

  request.onload = function() {
    ctx.decodeAudioData(request.response, function(b) {
      d.resolve(b);
    }, function(e){
      d.reject(e);
    });
  };
  request.onerror = function(e) {
    d.reject(e);
  };
  request.send();
  return d.promise;
}*/

function loadFileAudio (context, fileInput) {
  var d = Q.defer();
  var reader = new FileReader();
  reader.onload = function(e) {
    context.decodeAudioData(this.result, d.resolve, d.reject);
  };
  reader.readAsArrayBuffer(fileInput.files[0]);
  return d.promise;
}


function createVizs (ctx, container, out) {

  var div = $('<div style="margin-bottom: 20px" />').appendTo(container);

  var marginRight = 30;
  var sample = ctx.createBufferSource();
  sample.loop = true;
  var waveform = new Waveform({
  });
  var waveformView = new WaveformView({
    model: waveform
  });
  waveformView.$el.appendTo(div);
  waveformView.$el.css("margin-right", marginRight);
  waveform.setNode(out, ctx);

  var spectrum = new Spectrum({
  });
  var spectrumView = new SpectrumView({
    model: spectrum
  });
  spectrumView.$el.appendTo(div);
  spectrumView.$el.css("margin-right", marginRight);
  spectrum.setNode(out, ctx);

  var spectrogram = new Spectrogram({
  });
  var spectrogramView = new SpectrogramView({
    model: spectrogram
  });
  spectrogramView.$el.appendTo(div);
  spectrogram.setNode(out, ctx);

  return {
    update: function () {
      waveform.update();
      spectrum.update();
      spectrogram.update();
    }
  };
}

(function(){
// Play notes with the keyboard

var AZERTYconfig = {
  decrementOctaveKey: 186, // ":"
  incrementOctaveKey: 187, // "="
  keyCodeByTones: [
    87,83,88,68,67,86,71,66,72,78,74,188, // first octave (lower keyboard)
    65,50,90,222,69,82,53,84,54,89,55,85 // second octave (up keyboard)
  ]
};

var QWERTYconfig = {
  decrementOctaveKey: 190,
  incrementOctaveKey: 191,
  keyCodeByTones: [
    90,83,88,68,67,86,71,66,72,78,74,77, // first octave (lower keyboard)
    81,50,87,51,69,82,53,84,54,89,55,85 // second octave (up keyboard)
  ]
};

KeyboardController = Backbone.Model.extend({
  defaults: _.extend({
    octave: 4,
    keyCodeByTones: []
  }, QWERTYconfig),
  initialize: function () {
    $(window).on("keydown", _.bind(this.onKeydown, this));
    $(window).on("keyup", _.bind(this.onKeyup, this));
  },
  keysDown: [],
  onKeyup: function (e) {
    if (!e.which) return;
    this.keysDown = _.filter(this.keysDown, function (key) {
      return key !== e.which;
    });
    var tone = this.get("keyCodeByTones").indexOf(e.which);
    if (tone > -1) {
      e.preventDefault();
      var note = this.get("octave")*12+tone;
      if (note >= 0 && note <= 127) {
        this.trigger("noteOff", note);
      }
    }
  },
  onKeydown: function (e) {
    if (!e.which) return;
    var alreadyPressed = _.contains(this.keysDown, e.which);
    this.keysDown.push(e.which);
    if (e.altKey || e.shiftKey || e.metaKey || e.altKey) return;
    var incrX = 0, incrY = 0;

    if (e.which===this.get("incrementOctaveKey")) {
      this.set("octave", Math.min(9, this.get("octave")+1));
    }
    else if (e.which===this.get("decrementOctaveKey")) {
      this.set("octave", Math.max(0, this.get("octave")-1));
    }
    else {
      var tone = this.get("keyCodeByTones").indexOf(e.which);
      if (!alreadyPressed && tone > -1) {
        e.preventDefault();
        var note = this.get("octave")*12+tone;
        if (note >= 0 && note <= 127) {
          this.trigger("noteOn", note, 1);
        }
      }
    }
  }
}, {
  AZERTYconfig: AZERTYconfig,
  QWERTYconfig: QWERTYconfig
});

}());

(function(){

MIDIController = Backbone.Model.extend({
  initialize: function () {
    if ( !("requestMIDIAccess" in navigator) ) {
      console.log("requestMIDIAccess is not supported by your browser.");
      this.set("state", "error", new Error("MIDI not supported by your browser"));
      return;
    }

    this.set("state", "loading");
    this.midiAccessPromise = navigator.requestMIDIAccess();
    this.midiAccessPromise.then(_.bind(this.onMidiSuccess, this), _.bind(this.onMidiError, this));
  },

  bindInput: function (input) {
    input.onmidimessage = _.bind(this.onMidiMessage, this);
  },

  noteOn: function (noteNumber, noteVelocity) {
    this.trigger("noteOn", noteNumber, noteVelocity);
  },

  noteOff: function (noteNumber, noteVelocity) {
    this.trigger("noteOff", noteNumber, noteVelocity);
  },

  control: function (controlId, value) {
    this.trigger("control", controlId, value);
  },

  onMidiMessage: function (message) {
    // @see http://www.midi.org/techspecs/midimessages.php 
    var status = message.data[0];
    var byte2 = message.data[1];
    var byte3 = message.data[2];
    // We only handle Channel 1 here...
    switch (status) {
      case 128: // NOTE OFF
        this.noteOff(byte2, byte3/127);
        break;
      case 144: // NOTE ON
        this.noteOn(byte2, byte3/127);
        break;
      case 176: // control change
        this.control(byte2, byte3);
        break;
      case 192: // program change
        this.control("prog", byte2); // consider it as control
        break;
      case 224:
        this.control("PB", byte3+byte2/127);
        break;
      default:
        console.log( "Unknown status code : " + status);
    }
  },

  onMidiSuccess: function (midiAccess) {
    // OUCH this is not working! It seems we have to reboot the browser each time!
    midiAccess.onconnect = function () {
      console.log("onconnect", arguments);
    }
    midiAccess.ondisconnect = function () {
      console.log("ondisconnect", arguments);
    }

    var inputs = midiAccess.inputs();
    console.log("MIDI inputs: ", inputs);

    /*
    for (i=0; i<inputs.length; i++) {
      console.log( "Input port #" + i + 
          ": type:'" + inputs[i].type +
          "' id:'" + inputs[i].id +
          "' manufacturer:'" + inputs[i].manufacturer +
          "' name:'" + inputs[i].name +
          "' version:'" + inputs[i].version + "'" );
    }
    */

    if (inputs.length) {
      _.each(inputs, this.bindInput, this);
      this.set("state", "success");
    }
    else {
      this.set("state", "noinputs");
    }
  },
  onMidiError: function (error) {
    console.log("MIDI Access failed:", error);
    this.set("state", "error", error);
  }

});

}());
