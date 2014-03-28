var $ = require("jquery");

var analyser = require("./analyser")

var ctx = new (window.AudioContext || window.webkitAudioContext)();
var audio = new Audio();
var out = ctx.createGain();

var container = $("#container");
var waveform = new Waveform({
  width: 960,
  height: 200
});

var waveformView = new WaveformView({
  model: waveform
});

waveformView.$el.appendTo(container);

waveform.setNode(out, ctx);
/*
var spectrum = new Spectrum({
  width: 960,
  height: 200
});
var spectrumView = new SpectrumView({
  model: spectrum
});
spectrumView.$el.appendTo(container);
spectrum.setNode(out, ctx);
*/
// VOLUME
var volume = new Volume({
  width: 960,
  height: 200
});
var volumeView = new VolumeView({
  model: volume
});
volumeView.$el.appendTo(container);
volume.setNode(out, ctx);


// SPECTOGRAM
var spectrogram = new Spectrogram({
  width: 960,
  height: 200
});
var spectrogramView = new SpectrogramView({
  model: spectrogram
});
spectrogramView.$el.appendTo(container);
spectrogram.setNode(out, ctx);

var source = ctx.createMediaElementSource(audio);

var analyserNode = ctx.createAnalyser();

source.connect(analyserNode);
analyserNode.connect(out);

out.connect(ctx.destination);

analyser.setAnalyserNode(analyserNode);
analyser.start();

var nyquist = ctx.sampleRate / 2;
console.log("freq max", nyquist / 1000 + " kHz");

audio.autoplay = true;
audio.id = "audio-player";

// audio.src = "http://listen.radionomy.com/fuzzy-and-groovy";
// audio.src = "http://sacem.iliaz.com/radionova.ogg";
audio.src = "http://sacem.iliaz.com/spotify.ogg";

document.getElementById('player').appendChild(audio);

var player = document.getElementById('audio-player');
var btnPlay = document.getElementById('btn-play');
var btnPause = document.getElementById('btn-pause');

// Play/pause button
$('#btn-play').on('click', function() {

  if ( $('#icon').attr('class') == 'icon-play' ) {
    player.play();
    $('#icon').attr('class', 'icon-pause');
  }
  else if ($('#icon').attr('class') == 'icon-pause' ) {
    player.pause();
    $('#icon').attr('class', 'icon-play');
  }
});

document.getElementById('volume').addEventListener('change', function () {
  audio.volume = this.value;
});

player.addEventListener('timeupdate', function() {
  document.getElementById('duration').innerHTML = parseInt(this.currentTime);
});

/*
 * Save playlist url
 */

var tagsToReplace = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&lsquo;'
};

function replaceTag(tag) {
  return tagsToReplace[tag] || tag;
}

function safe_tags_replace(str) {
  return str.replace(/[&<>"']/g, replaceTag);
}

document.getElementById('form-playlist').addEventListener('submit', function (evt) {
  var urlValue = document.getElementById('input-url').value;
  var urls = JSON.parse(localStorage.getItem('urls')) || [];
  var safeUrl = safe_tags_replace(urlValue);

  // Push to array
  urls.push(safeUrl);

  // Save
  localStorage['urls'] = JSON.stringify(urls);

  // Display
  displayItem();

  // Clean input
  document.getElementById('input-url').value = '';
  
  // Avoid reload
  evt.preventDefault();
});

// Read urls of localstorage
function readUrls() {
  var urls = JSON.parse(localStorage.getItem('urls')) || [];

  return urls.map(function(url) {
    return '<li>' + url + '</li>';
  }).join('');
}

// Display items
function displayItem() {
  document.getElementById('playlist-items').innerHTML = readUrls();
} displayItem();


analyser.on("beginAd", function() {
  console.log("fading");
  var now = ctx.currentTime;
  out.gain.cancelScheduledValues( now );
  out.gain.setValueAtTime(1.0, now);
  out.gain.linearRampToValueAtTime(0.0, now + 1.0);
});

analyser.on("endAd", function() {
  console.log("fading up");
  var now = ctx.currentTime;
  out.gain.linearRampToValueAtTime(1.0, now + 1.0);
});

// out.gain.exponentialRampToValueAtTime(1, ctx.currentTime);
// out.gain.exponentialRampToValueAtTime(1.0, now + 4);
//   out.gain.linearRampToValueAtTime(0, ctx.currentTime + ctx.FADE_TIME);

(function loop () {
  //if (end.isFulfilled()) return;
  requestAnimationFrame(loop);
  waveform.update();
  //spectrum.update();
  volume.update();
  spectrogram.update();
} ());
