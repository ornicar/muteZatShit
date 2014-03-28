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

analyser.on("probability", function(freqs) {
  console.log(freqs[0]);
});


audio.src = "http://listen.radionomy.com/fuzzy-and-groovy";
audio.play();
