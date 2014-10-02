var $ = require('jquery');
var FastClick = require('fastclick');
require('foundation/foundation');
require('foundation/foundation.reveal');
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
var $body = $(document.body);
$body.on('click', 'a[href^=#]', function() {
  var $target = $(this.hash);
  if (!$target.length) {
    return;
  }
  var currentScrollTop = $htmlBody.scrollTop();
  var targetScrollTop = $target.offset().top - navbarHeight;
  var mills = Math.abs((targetScrollTop - currentScrollTop) / scrollSpeed);
  $htmlBody.animate({scrollTop: targetScrollTop}, mills);
  
  // Send fake pageview to GA when clicking on anchor
  window.ga && ga('send', 'pageview', '/' + this.hash.substr(1));
});

$body.on('click', '.course-curriculum__header', function() {
  // re-draw parallax because page height has changed
  setTimeout(function() {$(window).trigger('hwparallax.reconfigure');}, 500);
  
  // since the accordion is "css-only", this enables clearing the radio button if current box is open
  var $for = $('#' + $(this).attr('for'));
  if ($for.length && $for.prop('checked')) {
    setTimeout(function() {$for.prop('checked', false);}, 0);
  }
  else {
    // the accordion is being expanded, send a GA event
    var unitName = $(this).find('.course-curriculum__unit-name').text();
    window.ga && ga('send', 'event', 'curriculum', 'expand unit', unitName);
  }
});

// Application form
require('script-loader!parse');
var applicationFormValidator = require('parse-common/app-form-validator');
Parse.initialize('fyWcoNIpRkC4Tc18XJqHUKNFXoDkhTZqF1ceJeFS', 'IYowp9G78uLzKdnviez6NMtIJ4tx28ocqFcYJ0nW');

$('.application-form__send-button').on('click', function() {
  // Gather all keys/values from the form
  var values = $('.application-form__form')
    .serializeArray()
    .reduce(
      function(carry, current) {
        carry[current.name] = current.value;
        return carry;
      }, {}
    );
  // Validate
  var errors = applicationFormValidator(values);
  var errorKeys = Object.keys(errors);
  if (errorKeys.length) {
    // Has errors, alert about them
    var errorValues = errorKeys.map(function(key) {return errors[key]});
    alert(errorValues.join("\r\n"));
  }
  else {
    // No errors, submit!
    $('#application-form').addClass('application-form--submitting');
    Parse.Cloud.run('sendApplication', {values: values}).then(
      function() {
        alert('Your application was submitted successfully!');
        $('#application-form').removeClass('application-form--submitting').foundation('reveal', 'close');
      },
      function(error) {
        var errorMessage = error && error.error || 'Unknown error';
        alert("An error occurred while submitting your application:\r\n\r\n" + errorMessage);
        $('#application-form').removeClass('application-form--submitting');
      }
    )
  }
});

// Send an event after 30 seconds to prevent inaccurate bounce rate
setTimeout(function() {
  window.ga && ga('send', 'event', 'activity', 'user spent 30 seconds on page');
}, 30 * 1000);