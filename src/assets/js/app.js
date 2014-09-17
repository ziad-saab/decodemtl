var $ = require('jquery');
var FastClick = require('fastclick');
require('foundation/foundation');
require('hw-parallax/src/hw-parallax');

FastClick.attach(document.body);
$(document).foundation();

if (!Modernizr.touch) {
  $('.intro-section').parallax({
    scroll_factor: 0.5
  });
  $('.instructor__heading').parallax({
    scroll_factor: 0.2
  });
}