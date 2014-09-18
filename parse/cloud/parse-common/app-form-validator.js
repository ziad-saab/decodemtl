module.exports = function(values) {
  if (!values) {
    return false;
  }
  
  var errors = {};
  var required = {
    firstName: 'First name',
    lastName: 'Last name',
    emailAddress: 'Email address',
    phoneNumber: 'Phone number',
    currentCity: 'Current city',
    leadSource: 'How you heard about us',
    whyApplying: 'Why are you applying',
    education: 'Education background',
    hobbies: 'Hobbies and passions',
    plans: 'Plans',
    codingBackground: 'Coding background'
  };
  
  Object.keys(required).forEach(function(key) {
    if (!values[key]) {
      errors[key] = required[key] + ' is required';
    }
  });
  
  return errors;
};