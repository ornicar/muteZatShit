

// array: audio sample
function calcVolume(array) {
  var lenght = array.length;
  var v = 0;
  for(var i = 0; i < length; i++) {
    var d = array[i];
    v += d * d;
  }
  console.log("volume", v);
  return v;
}

