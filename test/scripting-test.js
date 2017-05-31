
var cfConfig = require('../cfConfig');
var assert = require('assert');

console.log('helo');

describe('cf-script:', function() {

  describe('cfConfig:', function() {
    it('init', () => {
      var config = cfConfig.initSync();
      var config2 = cfConfig.getConfig();
      assert.deepEqual(config, config2, 'should be equal');
      console.log(config);
    });
    // TODO writeConfigFileSync
  });

});
