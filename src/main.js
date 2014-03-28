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

analyser.on("isAd", function(isAd) {
  console.log("AD !!!");
});

audio.autoplay = true;
audio.id = "audio-player";

// audio.src = "http://listen.radionomy.com/fuzzy-and-groovy";
audio.src = "http://sacem.iliaz.com/radionova.ogg";
audio.src = "http://sacem.iliaz.com/radionova.ogg";

document.getElementById('player').appendChild(audio);

var player = document.getElementById('audio-player');
var btnPlay = document.getElementById('btn-play');
var btnPause = document.getElementById('btn-pause');

// Play button
btnPlay.addEventListener('click', function() {
  player.play();
});

// Pause button
btnPause.addEventListener('click', function() {
  player.pause();
});

document.getElementById('volume').addEventListener('change', function () {
  // gainNode.gain.value = this.value;
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
