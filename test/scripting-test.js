
var ccs = require('../../cf-cli-script');
var assert = require('assert');
var testSettings = require('./test-settings');

describe('cf-script:', function() {

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

  describe('apps:', function() {
    before(()=>{
      ccs.loginSync(testSettings.uaaUrl,testSettings.org,testSettings.user,testSettings.password);
    });

    it('push app, set env, get env, delete app', () => {
      return new Promise((resolve, reject) => {
        const appName = 'cf-cli-script-test-app';
        ccs.push(appName, {'no-start': null, p: './test/test-app'})
        .catch(error => {
          console.log('push failed:' + error);
          reject(error);
        })
        .then(result => {
          ccs.setEnv(appName,'formation','formationJson')
          .catch(error => {
            console.log('setEnv failed:' + error);
            reject(error);
          })
          .then(result => {

            ccs.getEnv(appName)
            .catch(error => {
              console.log('getEnv failed:' + error);
              reject(error);
            })
            .then(result => {
              console.log('----------');
              console.log(result);
              console.log('----------');
              console.log(result.includes('formationJson'));
              console.log('----------');
              if (!result.includes('formationJson')) reject('env var not present');

              ccs.deleteApp(appName)
              .catch(error => {
                console.log('deleteApp failed:' + error);
                reject(error);
              })
              .then(() => resolve(result));



            });



          });
        });

      });

    });

  });


});
