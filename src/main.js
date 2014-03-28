var $ = require("jquery");

var analyser = require("./analyser");

var ctx = new (window.AudioContext || window.webkitAudioContext)();
var audio = new Audio();
var out = ctx.createGain();

var container = $("#container");

var vizWhith = 500;
var vizHeigth = 150;
var waveform = new Waveform({
  width: vizWhith,
  height: vizHeigth
});

var waveformView = new WaveformView({
  model: waveform
});

waveformView.$el.appendTo(container);

waveform.setNode(out, ctx);
/*
var spectrum = new Spectrum({
  width: vizWhith,
  height: vizHeigth
});
var spectrumView = new SpectrumView({
  model: spectrum
});
spectrumView.$el.appendTo(container);
spectrum.setNode(out, ctx);
*/
// VOLUME
var volume = new Volume({
  width: vizWhith,
  height: vizHeigth,
  bg: "transparent"
});
var volumeView = new VolumeView({
  model: volume
});
volumeView.$el.appendTo(container);
volume.setNode(out, ctx);


// SPECTOGRAM
var spectrogram = new Spectrogram({
  width: vizWhith,
  height: vizHeigth
});
var spectrogramView = new SpectrogramView({
  model: spectrogram,
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

analyser.on("endAd", function() {
  $("#isAd").fadeOut();
});

analyser.on("beginAd", function() {
  console.log("AD !!!");
  $("#isAd").show();
})

function readUrls() {
  return JSON.parse(localStorage.getItem('urls')) || [];
}

if (readUrls().length === 0) {
  localStorage['urls'] = JSON.stringify([
    "http://listen.radionomy.com/fuzzy-and-groovy",
    "http://sacem.iliaz.com/radionova.ogg",
    "http://listen.radionomy.com/radio-mozart",
    "http://stream3.jungletrain.net:8000/"
  ]);
}

audio.autoplay = true;
audio.id = "audio-player";

// audio.src = "http://listen.radionomy.com/fuzzy-and-groovy";
// audio.src = "http://sacem.iliaz.com/radionova.ogg";
audio.src = readUrls()[0];

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
  var urls = readUrls();
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
function renderUrls() {
  var urls = readUrls();

  return urls.map(function(url) {
    return '<li>' + url + '</li>';
  }).join('');
}

// Display items
function displayItem() {
  document.getElementById('playlist-items').innerHTML = renderUrls();
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

var showTitleTimeout;

function showTitle() {
  console.debug(audio.src);
  $.ajax({
    url: "http://mzs.iliaz.com",
    data: {
      url: audio.src
    },
    success: function(obj) {
      $('#title').text(obj.title);
      if (showTitleTimeout) clearTimeout(showTitleTimeout);
      showTitleTimeout = setTimeout(function() {
        showTitle();
      }, obj.remaining * 1000);
    }
  });
}

(function loop () {
  //if (end.isFulfilled()) return;
  requestAnimationFrame(loop);
  waveform.update();
  //spectrum.update();
  volume.update();
  spectrogram.update();
} ());

$(function() {
  $('#playlist-items').on('click', 'li', function() {
    var url = $(this).text();
    audio.src = url;
    showTitle(url);
  });
  showTitle();
});
