var $ = require('jquery');
window.$ = window.jQuery = $;
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

  $('.od-parallax').parallax({
    scroll_factor: 0.3
  });
}

var $body = $(document.body);
$body.on('click', '.course-curriculum__header:not(.sql-workshop .course-curriculum__header)', function() {

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

  // re-draw parallax because page height has changed
  setTimeout(function() {$(window).trigger('hwparallax.reconfigure');}, 0);
});

$body.on('click', '.faq-list__header', function() {
  // since the accordion is "css-only", this enables clearing the radio button if current box is open
  var $for = $('#' + $(this).attr('for'));
  if ($for.length && $for.prop('checked')) {
    setTimeout(function() {$for.prop('checked', false);}, 0);
  }
  else {
    // the accordion is being expanded, send a GA event
    var questionText = $(this).find('.faq-list__header').text();
    window.ga && ga('send', 'event', 'faq', 'expand question', questionText);
  }

  // re-draw parallax because page height has changed
  setTimeout(function() {$(window).trigger('hwparallax.reconfigure');}, 0);
});

// Application form
require('script-loader!parse');
var applicationFormValidator = require('parse-common/app-form-validator');
Parse.initialize('fyWcoNIpRkC4Tc18XJqHUKNFXoDkhTZqF1ceJeFS', 'IYowp9G78uLzKdnviez6NMtIJ4tx28ocqFcYJ0nW');

$('.application-form__send-button').on('click', function() {
  // Send a GA event for attempting to submit
  window.ga && ga('send', 'event', 'application form', 'submit attempt');

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

    // Send GA event with errors
    window.ga && ga('send', 'event', 'application form', 'submit errors', errorValues.join(','));
  }
  else {
    // No errors, submit!
    $('#application-form').addClass('application-form--submitting');
    Parse.Cloud.run('sendApplication', {values: values}).then(
      function() {
        alert('Your application was submitted successfully!');
        $('#application-form').removeClass('application-form--submitting').foundation('reveal', 'close');

        // Send GA event for parse submit success
        window.ga && ga('send', 'event', 'application form', 'submit to parse success');
      },
      function(error) {
        var errorMessage = error && error.error || 'Unknown error';
        alert("An error occurred while submitting your application:\r\n\r\n" + errorMessage);
        $('#application-form').removeClass('application-form--submitting');

        // Send GA event for parse submit error
        window.ga && ga('send', 'event', 'application form', 'submit to parse error', errorMessage);
      }
    );

    // Send GA event for parse submit attempt
    window.ga && ga('send', 'event', 'application form', 'submit to parse attempt');
  }
});

// Send an event after 30 seconds to prevent inaccurate bounce rate
setTimeout(function() {
  window.ga && ga('send', 'event', 'activity', 'user spent 30 seconds on page');
}, 30 * 1000);
