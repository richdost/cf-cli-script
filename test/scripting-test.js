
var ccs = require('../../cf-cli-script');
var assert = require('assert');
var testSettings = require('./test-settings');


describe('cf-script:', function() {

  // describe('cfConfig:', function() {
  //   it('init', () => {
  //     var config = cfConfig.initSync();
  //     var config2 = cfConfig.getConfig();
  //     assert.deepEqual(config, config2, 'should be equal');
  //     console.log(config);
  //   });
  //   // TODO writeConfigFileSync
  // });

  describe('loginSync:', function() {
    it('bad login', () => {
    	var result = ccs.loginSync(testSettings.uaaUrl,testSettings.org,testSettings.user,'fubar');
    	assert(!result,'Login successful but should have failed');
    });
    it('good login', () => {
    	var result = ccs.loginSync(testSettings.uaaUrl,testSettings.org,testSettings.user,testSettings.password);
    	assert(result,'Failed to login when should have been successful');
    });
  });


});
