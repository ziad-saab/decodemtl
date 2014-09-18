var config = require('cloud/config');
var Mandrill = require('mandrill');
var applicationFormValidator = require('cloud/parse-common/app-form-validator');
var ApplicationForm = Parse.Object.extend('ApplicationForm');
Mandrill.initialize(config.mandrillApiKey);

Parse.Cloud.define('sendApplication', function(request, response) {
  var values = request.params.values;
  var errors = applicationFormValidator(values);
  if (!errors) {
    response.error('invalid request');
    return;
  }
  if (Object.keys(errors).length) {
    response.error(errors);
  }
  else {
    Parse.Cloud.useMasterKey();
    // Just save the form for now. A background job will take care of sending us e-mails later on
    var appForm = new ApplicationForm({values: values});
    appForm.save().then(
      function() {
        response.success();
      },
      function() {
        response.error('your application could not be submitted at this time. please try again later');
      }
    )
  }
});