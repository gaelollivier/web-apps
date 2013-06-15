
// shim layer with setTimeout fallback
window.requestAnimationFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

// From http://stackoverflow.com/questions/466204/rounding-off-to-nearest-power-of-2
function upperPowerOfTwo(v) {
    v--;
    v |= v >> 1;
    v |= v >> 2;
    v |= v >> 4;
    v |= v >> 8;
    v |= v >> 16;
    v++;
    return v;
}

function colorFromHex(hex) {
	if (typeof hex != 'string')
		hex = hex.toString(16);
	if (hex.charAt(0) == '#') {
		hex = hex.substr(1);
	}
	return [
		parseInt('0x' + hex.substr(0, 2)) / 255,
		parseInt('0x' + hex.substr(2, 2)) / 255,
		parseInt('0x' + hex.substr(4, 2)) / 255
	];
}

function hexFromColor(color) {
	var hex = '#';
	for (var i = 0; i < 3; ++i) {
		var part = parseInt(color[i] * 255).toString(16);
		hex += part.length == 1 ? ('0' + part) : part;
	}
	return hex;
}