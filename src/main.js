var analyser = require("./analyser")

var ctx = new (window.AudioContext || window.webkitAudioContext)();
var audio = new Audio();
var out = ctx.createGain();
var source = ctx.createMediaElementSource(audio);

var analyserNode = ctx.createAnalyser();

source.connect(analyserNode);
analyserNode.connect(out);
out.connect(ctx.destination);

analyser.setAnalyserNode(analyserNode);
analyser.start();

var nyquist = ctx.sampleRate / 2;
console.log("freq max", nyquist / 1000 + " kHz");

analyser.on("probability", function(freqs) {
  //console.log(freqs);
});


audio.src = "http://listen.radionomy.com/fuzzy-and-groovy";
audio.play();
