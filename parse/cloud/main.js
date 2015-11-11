var async = require('cloud/node_modules/async/lib/async');
var _ = require('underscore');
var fs = require('fs');
var config = require('cloud/config');
var applicationFormValidator = require('cloud/parse-common/app-form-validator');
var ApplicationForm = Parse.Object.extend('ApplicationForm');

var confirmationTemplate = _.template(fs.readFileSync('cloud/templates/confirmation.ejs'));
var confirmationTemplateFrench = _.template(fs.readFileSync('cloud/templates/confirmation-fr.ejs'));
var applicationTemplate = _.template(fs.readFileSync('cloud/templates/application.ejs'));

function _sendEmail(params) {
  params.key = config.mandrillApiKey;
  return Parse.Cloud.httpRequest({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    url: 'https://mandrillapp.com/api/1.0/messages/send.json',
    body: params
  });
}

Parse.Cloud.define('sendApplication', function (request, response) {
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
        function () {
          response.success();
        },
        function () {
          response.error('your application could not be submitted at this time. please try again later');
        }
    )
  }
});

Parse.Cloud.job('sendEmails', function (request, status) {
  Parse.Cloud.useMasterKey();
  var logMessages = [];
  new Parse.Query('ApplicationForm')
      .notEqualTo('emailSent', true)
      .find()
      .then(
      function (applications) {
        var applicationsToProcess = applications.length;
        var applicationsProcessed = 0;
        async.eachLimit(
            applications, 2,
            function (application, nextApp) {
              var values = application.get('values');
              var emailAddress = values.emailAddress;
              var firstName = values.firstName;
              var lastName = values.lastName;
              var fullName = firstName + ' ' + lastName;

              var logMessage = 'Sending confirmation e-mail to ' + firstName + ' ' + lastName + ' <' + emailAddress + '>';
              console.log(logMessage);
              logMessages.push(logMessage);

              var tpl = values.lang == 'fr' ? confirmationTemplateFrench : confirmationTemplate;
              var text = tpl(values);

              _sendEmail(
                  {
                    message: {
                      from_email: 'hello@decodemtl.com',
                      from_name: 'DecodeMTL Team',
                      subject: 'DecodeMTL Application',
                      to: [
                        {
                          email: emailAddress,
                          name: fullName
                        }
                      ],
                      text: text
                    },
                    async: true
                  }).then(
                  function () {
                    application.set('emailSent', true).save().then(
                        function () {
                          applicationsProcessed++;
                          status.message(applicationsProcessed + '/' + applicationsToProcess + ' processed');

                          _sendEmail(
                              {
                                message: {
                                  from_email: 'no-reply@decodemtl.com',
                                  from_name: 'DecodeMTL Bot',
                                  subject: 'New DecodeMTL Application',
                                  to: config.applicationRecipients,
                                  text: applicationTemplate(values)
                                },
                                async: true
                              }).then(
                              function () {
                                nextApp();
                              },
                              function () {
                                nextApp();
                              }
                          );
                        },
                        function (error) {
                          nextApp(error);
                        }
                    );
                  },
                  function (error) {
                    nextApp(error);
                  }
              );
            },
            function (err) {
              if (err) {
                status.error(JSON.stringify(err));
              }
              else {
                status.success("Sent " + applicationsProcessed + " emails\n\n" + logMessages.join("\n"));
              }
            }
        );
      },
      function (error) {
        status.error(JSON.stringify(error));
      }
  );
});