var _ = require("underscore")

var ctx = new (window.AudioContext || window.webkitAudioContext)();
var audio = new Audio();
var out = ctx.createGain()
var source = ctx.createMediaElementSource(audio);
source.connect(out);
out.connect(ctx.destination);

audio.src = "http://listen.radionomy.com/eda-music-radio";
audio.play();
