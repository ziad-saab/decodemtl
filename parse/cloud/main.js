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
  return Parse.Cloud.httpRequest({
    method: 'POST',
    url: 'https://api.sendgrid.com/api/mail.send.json',
    body: params,
    headers: {
      authorization: 'Bearer ' + config.sendgridApiKey
    }
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
                    from: 'hello@decodemtl.com',
                    fromname: 'DecodeMTL Team',
                    subject: 'DecodeMTL Application',
                    'to[]': emailAddress,
                    'toname[]': fullName,
                    text: text
                  }).then(
                  function () {
                    application.set('emailSent', true).save().then(
                        function () {
                          applicationsProcessed++;
                          status.message(applicationsProcessed + '/' + applicationsToProcess + ' processed');

                          _sendEmail(
                              {
                                from: 'no-reply@decodemtl.com',
                                fromname: 'DecodeMTL Bot',
                                subject: 'New DecodeMTL Application',
                                'to[]': config.applicationRecipients[0].email,
                                'toname[]': config.applicationRecipients[0].name,
                                text: applicationTemplate(values)
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
