var $ = require('jquery');
var FastClick = require('fastclick');
require('foundation/foundation');
require('hw-parallax/src/hw-parallax');

FastClick.attach(document.body);
$(document).foundation();

// Parallax
if (!Modernizr.touch) {
  $('.intro-section,.schedule').parallax({
    scroll_factor: 0.5
  });
  $('.instructor__heading').parallax({
    scroll_factor: 0.2
  });
}

// Smooth scrolling of anchors
var scrollSpeed = 1.66; // pixels per millisecond
var $htmlBody = $('html,body');
var navbarHeight = $('.main-header').outerHeight();
$(document.body).on('click', 'a[href^=#]', function() {
  var $target = $(this.hash);
  if (!$target) {
    return;
  }
  var currentScrollTop = $htmlBody.scrollTop();
  var targetScrollTop = $target.offset().top - navbarHeight;
  var mills = Math.abs((targetScrollTop - currentScrollTop) / scrollSpeed);
  $htmlBody.animate({scrollTop: targetScrollTop}, mills);
});