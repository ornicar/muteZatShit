var Backbone = require("backbone");
var $ = require("jquery");
var _ = require("underscore");

Waveform = Backbone.Model.extend({
  defaults: {
    samples: 256,
    width: 300,
    height: 200,
    strokeSize: 4,
    bg: "transparent",
    color: "white"
  },
  initialize: function () {
    this.on("change:samples", this.syncSamples);
    this.syncSamples();
    this.lastUpdate = Date.now();
  },
  setNode: function (audioNode, audioCtx) {
    this.set("sampleRate", audioCtx.sampleRate);
    this.analyser = audioCtx.createAnalyser();
    audioNode.connect(this.analyser);
  },
  switchViz: function () {
    this.set("viz", (this.get("viz") + 1) % 3);
  },
  syncSamples: function () {
    this.array = new Uint8Array(this.get("samples"));
  },
  update: function () {
    var now = Date.now();
    var rate = 1000 * this.get("samples") / this.get("sampleRate");
    var refreshRate = rate * Math.round(40 / rate);
    if (now-this.lastUpdate > refreshRate) {
      this.lastUpdate = now;
      this.analyser.getByteTimeDomainData(this.array);
      this.trigger("update");
    }
  }
});

WaveformView = Backbone.View.extend({
  tagName: "div",
  className: "waveform",
  attributes: {
    style: "display:inline-block"
  },
  initialize: function (opts) {
    this.canvas = document.createElement("canvas");
    this.$container = $('<div style="position:relative" />');
    this.$container.append(this.canvas);
    if (!opts.noControls) {
      this.$wfcontrols = $('<div style="position:absolute;right:5px;top:0px" />').appendTo(this.$container);
      this.$minus = $('<button class="wf-minus">-</button>').appendTo(this.$wfcontrols);
      this.$wf = $('<span class="wf"></span>').appendTo(this.$wfcontrols);
      this.$wf.css({
        color: "#fff",
        fontSize: "20px",
        padding: "0 10px"
      });
      this.$plus = $('<button class="wf-plus">+</button>').appendTo(this.$wfcontrols);
      var syncWf = _.bind(function () {
        this.$wf.text((Math.round(10000 * this.model.get("samples") / this.model.get("sampleRate"))/10)+" ms");
      }, this);
      this.model.on("change:samples change:sampleRate", syncWf);
      syncWf();
    }
    this.$el.append(this.$container);
    this.ctx = this.canvas.getContext("2d");
    this.listenTo(this.model, "change:width change:height", this.syncSize);
    this.listenTo(this.model, "update", this.render);
    this.syncSize();
  },
  events: {
    "click .wf-plus": "onWfPlus",
    "click .wf-minus": "onWfMinus"
  },
  onWfPlus: function () {
    this.model.set("samples", Math.min(2048, this.model.get("samples")*2));
  },
  onWfMinus: function () {
    this.model.set("samples", Math.max(32, this.model.get("samples")/2));
  },
  syncSize: function () {
    var w = this.model.get("width");
    var h = this.model.get("height");
    this.$container.css({
      width: w,
      height: h
    });
    this.canvas.width = w;
    this.canvas.height = h;
    this.render(this.ctx);
  },
  render: function () {
    var ctx = this.ctx;
    var arrayWaveform = this.model.array;
    var lengthWaveform = arrayWaveform.length;

    var W = ctx.canvas.width;
    var H = ctx.canvas.height;
    var fy = function (y) {
      y = y/256; // normalize
      return y * H;
    }

    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = this.model.get("bg");
    ctx.fillRect(0,0,W,H);
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';

    // Waveform
    ctx.beginPath();
    ctx.moveTo(0, fy(arrayWaveform[0]));
    for (var i=0; i<lengthWaveform; ++i) {
      ctx.lineTo(W*(i+1)/lengthWaveform, fy(arrayWaveform[i]));
    }

    ctx.strokeStyle = "#000";
    ctx.lineWidth = this.model.get("strokeSize");
    ctx.stroke();

    ctx.strokeStyle = this.model.get("color");
    ctx.lineWidth = this.model.get("strokeSize")-1;
    ctx.stroke();
  }
});

Spectrum = Backbone.Model.extend({
  defaults: {
    samples: 32,
    width: 300,
    height: 200,
    refreshRate: 40,
    bg: "black",
    gradientColors: ['rgba(255,50,0,0.8)', 'rgba(0,255,0,0.8)']
  },
  initialize: function () {
    this.on("change:samples", this.syncSamples);
    this.syncSamples();
    this.lastUpdate = Date.now();
  },
  syncSamples: function () {
    this.array = new Uint8Array(this.get("samples"));
  },
  setNode: function (audioNode, audioCtx) {
    this.analyzer = audioCtx.createAnalyser();
    function syncAnalyzer (m) {
      m.analyzer.smoothingTimeConstant = 0.5;
      m.analyzer.fftSize = m.get("samples") * 2;
    }
    syncAnalyzer(this);
    this.on("change:samples", syncAnalyzer);
    audioNode.connect(this.analyzer);
  },
  update: function () {
    var now = Date.now();
    if (now-this.lastUpdate > this.get("refreshRate")) {
      this.lastUpdate = now;
      this.analyzer.getByteFrequencyData(this.array);
      this.trigger("update");
    }
  }
});

SpectrumView = Backbone.View.extend({
  tagName: "div",
  className: "spectrum",
  attributes: {
    style: "display:inline-block"
  },
  events: {
    "click .sp-plus": "onPlus",
    "click .sp-minus": "onMinus"
  },
  onPlus: function () {
    this.model.set("samples", Math.min(1024, this.model.get("samples")*2));
  },
  onMinus: function () {
    this.model.set("samples", Math.max(16, this.model.get("samples")/2));
  },
  initialize: function (opts) {
    this.canvas = document.createElement("canvas");
    this.$container = $('<div style="position:relative" />');
    this.$container.append(this.canvas);
    if (!opts.noControls) {
      this.$spcontrols = $('<div style="position:absolute;right:5px;top:0px" />').appendTo(this.$container);
      this.$minus = $('<button class="sp-minus">-</button>').appendTo(this.$spcontrols);
      this.$sp = $('<span class="sp"></span>').appendTo(this.$spcontrols);
      this.$sp.css({
        color: "#fff",
        fontSize: "20px",
        padding: "0 10px"
      });
      this.$plus = $('<button class="sp-plus">+</button>').appendTo(this.$spcontrols);
      var syncsp = _.bind(function () {
        this.$sp.text(this.model.get("samples"));
      }, this);
      this.model.on("change:samples", syncsp);
      syncsp();
    }
    this.$el.append(this.$container);
    this.ctx = this.canvas.getContext("2d");
    this.listenTo(this.model, "change:width change:height", this.syncSize);
    this.listenTo(this.model, "update", this.render);
    this.syncSize();
  },
  syncSize: function () {
    var w = this.model.get("width");
    var h = this.model.get("height");
    this.canvas.width = w;
    this.canvas.height = h;
    this.render(this.ctx);
  },
  render: function () {
    var ctx = this.ctx;
    var arraySpectrum = this.model.array;
    var lengthSpectrum = arraySpectrum.length;

    var W = ctx.canvas.width;
    var H = ctx.canvas.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = this.model.get("bg");
    ctx.fillRect(0,0,W,H);

    // Spectrum Analyzer
    var gradient = ctx.createLinearGradient(0,0,0,H);
    var gradientColors = this.model.get("gradientColors");
    var last = gradientColors.length - 1;
    for (var i=last; i>=0; i--) {
      gradient.addColorStop(i/last, gradientColors[last-i]);
    }

    var freqw = Math.round(W / lengthSpectrum); // We can afford to lose some high freq viz...
    var freqborder = Math.floor(freqw / 5);
    for (var i=0; i<lengthSpectrum; ++i) {
      var value = arraySpectrum[i];
      var x = i*freqw;
      var w = freqw-freqborder;
      ctx.fillStyle = gradient;
      ctx.fillRect(x,H-(H*value/256),w,H);
    }
  }
});

Spectrogram = Backbone.Model.extend({
  defaults: {
    samples: 1024,
    width: 300,
    height: 200,
    refreshRate: 1000/60,
    gradientColors: ['#fff','#000']
  },
  initialize: function () {
    this.on("change:samples", this.syncSamples);
    this.syncSamples();
    this.lastUpdate = Date.now();
  },
  syncSamples: function () {
    this.array = new Uint8Array(this.get("samples"));
  },
  setNode: function (audioNode, audioCtx) {
    this.analyzer = audioCtx.createAnalyser();
    function syncAnalyzer (m) {
      m.analyzer.smoothingTimeConstant = m.get("refreshRate")/1000;
      m.analyzer.fftSize = m.get("samples") * 2;
    }
    syncAnalyzer(this);
    this.on("change:samples change:refreshRate", syncAnalyzer);
    audioNode.connect(this.analyzer);
  },
  update: function () {
    var now = Date.now();
    if (now-this.lastUpdate > this.get("refreshRate")) {
      this.lastUpdate = now;
      this.analyzer.getByteFrequencyData(this.array);
      this.trigger("update");
    }
  }
});

SpectrogramView = Backbone.View.extend({
  tagName: "div",
  className: "spectrum",
  attributes: {
    style: "display:inline-block"
  },
  initialize: function (opts) {
    this.gran = 256;
    this.canvas = document.createElement("canvas");
    this.$el.append(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    this.generateGradientCanvas();
    this.syncSize();
    this.listenTo(this.model, "change:gradientColors", this.generateGradientCanvas);
    this.listenTo(this.model, "change:width change:height", this.syncSize);
    this.listenTo(this.model, "update", this.render);
  },
  syncSize: function () {
    var w = this.model.get("width");
    var h = this.model.get("height");
    this.canvas.width = w;
    this.canvas.height = h;
    this.render(this.ctx);
  },
  generateGradientCanvas: function () {
    var canvas = document.createElement("canvas");
    canvas.width = this.gran;
    canvas.height = 1;
    var ctx = canvas.getContext("2d");
    var gradientColors = this.model.get("gradientColors");
    var gradient = ctx.createLinearGradient(0,0,this.gran,0);
    var last = gradientColors.length - 1;
    for (var i=last; i>=0; i--) {
      gradient.addColorStop(i/last, gradientColors[last-i]);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.gran, 1);
    var imgd = ctx.getImageData(0, 0, this.gran, 1);
    document.body.appendChild(canvas);
    this.gradientData = imgd.data;
  },
  getGradientValue: function (percent) {
    var i = Math.floor(this.gran*percent);
    var r = this.gradientData[i*4];
    var g = this.gradientData[i*4+1];
    var b = this.gradientData[i*4+2];
    return "rgb("+r+","+g+","+b+")";
  },
  render: function () {
    var ctx = this.ctx;
    var arraySpectrum = this.model.array;
    var lengthSpectrum = arraySpectrum.length;

    var W = ctx.canvas.width;
    var H = ctx.canvas.height;

    // Spectrum Analyzer
    ctx.drawImage(ctx.canvas, -1, 0);
    var freqh = H / lengthSpectrum; // We can afford to lose some high freq viz...
    for (var i=0; i<lengthSpectrum; ++i) {
      var value = arraySpectrum[i];
      var y = i*freqh;
      ctx.fillStyle = this.getGradientValue(value/256);
      ctx.fillRect(W-1,H-y,1,freqh);
    }
  }
});

Volume = Backbone.Model.extend({
  defaults: {
    samples: 1024,
    width: 300,
    height: 200,
    refreshRate: 1000/60,
    gradientColors: ['#fff','#000']
  },
  initialize: function () {
    this.on("change:samples", this.syncSamples);
    this.syncSamples();
    this.lastUpdate = Date.now();
  },
  syncSamples: function () {
    this.array = new Uint8Array(this.get("samples"));
  },
  setNode: function (audioNode, audioCtx) {
    this.analyzer = audioCtx.createAnalyser();
    function syncAnalyzer (m) {
      m.analyzer.smoothingTimeConstant = m.get("refreshRate")/1000;
      m.analyzer.fftSize = m.get("samples") * 2;
    }
    syncAnalyzer(this);
    this.on("change:samples change:refreshRate", syncAnalyzer);
    audioNode.connect(this.analyzer);
  },
  update: function () {
    var now = Date.now();
    if (now-this.lastUpdate > this.get("refreshRate")) {
      this.lastUpdate = now;
      this.analyzer.getByteTimeDomainData(this.array);
      this.trigger("update");
    }
  }
});

VolumeView = Backbone.View.extend({
  tagName: "div",
  className: "volume",
  attributes: {
    style: "display:inline-block"
  },
  initialize: function (opts) {
    this.gran = 256;
    this.canvas = document.createElement("canvas");
    this.$el.append(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    //this.generateGradientCanvas();
    this.syncSize();
    //this.listenTo(this.model, "change:gradientColors", this.generateGradientCanvas);
    this.listenTo(this.model, "change:width change:height", this.syncSize);
    this.listenTo(this.model, "update", this.render);
  },
  syncSize: function () {
    var w = this.model.get("width");
    var h = this.model.get("height");
    this.canvas.width = w;
    this.canvas.height = h;
    this.render(this.ctx);
  },
  generateGradientCanvas: function () {
    var canvas = document.createElement("canvas");
    canvas.width = this.gran;
    canvas.height = 1;
    var ctx = canvas.getContext("2d");
    /*var gradientColors = this.model.get("gradientColors");
    var gradient = ctx.createLinearGradient(0,0,this.gran,0);
    var last = gradientColors.length - 1;
    for (var i=last; i>=0; i--) {
      gradient.addColorStop(i/last, gradientColors[last-i]);
    }
    //ctx.fillStyle = gradient;
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.gran, 1);
    var imgd = ctx.getImageData(0, 0, this.gran, 1);*/
    document.body.appendChild(canvas);
    // this.gradientData = imgd.data;
  },
  /*getGradientValue: function (percent) {
    var i = Math.floor(this.gran*percent);
    var r = this.gradientData[i*4];
    var g = this.gradientData[i*4+1];
    var b = this.gradientData[i*4+2];
    return "rgb("+r+","+g+","+b+")";
  },*/
  render: function () {
    var ctx = this.ctx;
    var arrayVol = this.model.array;
    var lengthVol = arrayVol.length;

    var W = ctx.canvas.width;
    var H = ctx.canvas.height;

    ctx.drawImage(ctx.canvas, -1, 0);
    //var freqh = H / lengthVol; // We can afford to lose some high freq viz...
    var vol = 0;
    var max = -128;
    for (var i=0; i<lengthVol; ++i) {
      var value = arrayVol[i] - 128;
      vol += value*value;
      if(value > max) max = value;
      //ctx.fillStyle = this.getGradientValue(value/256);
      //ctx.fillRect(W-1,H-y,1,freqh);
    }
    //var p = (vol / max) * H;
    var p = H * vol / (max*max*lengthVol);
    ctx.fillStyle = "#000"; //this.getGradientValue(p);
    ctx.fillRect(W-1, 0, 1, H);
    ctx.fillStyle = "#fff"; //this.getGradientValue(p);
    ctx.fillRect(W-1, 0, 1, p);
  }
});


