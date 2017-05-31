// Ensures that the cf cli is installed.
// Reads in the config.json so that token and endpoint etc are available
// Assumes token is valid but perhaps we should check that it is recent enough.

var fs = require('fs');
var os = require('os');
var path = require('path');
var execSync = require('child_process').execSync;
var jsonFile = require('jsonfile');
var extend = require('extend');

const configFilePath = os.homedir() + path.sep + '.cf/config.json';
var config = null;

// CF is currently required
function requireCf(){
  return (execSync('cf --version').toString().indexOf('not found') === -1);
}

// Makes sure cf cli is installed, config is present and token is valid
function initSync(){
  if (!requireCf()) throw new Error('Error: cf is not installed and is required for using cfScript.');
  if (!fs.existsSync(configFilePath)) throw new Error('Error: Please do cf login');
  config = jsonFile.readFileSync(configFilePath, {throws: false}) || null;
  if (!config) throw new Error('Error: Failed to read ~/.cf/config.json.');
  return config;
}

function getConfig(){
  return extend({}, config);
}

function writeConfigSync(newConfig){ // TODO delete if not used after awhile else write test
  config = newConfig;
  jsonFile.writeFileSync(configFilePath, config, {spaces: 4});
}

/*
// TODO use and test
// Maybe use to validate token or do refresh?
// UAA REST API see https://docs.cloudfoundry.org/api/uaa/#create94
// TODO move this to base then remove the base dependency or else somehowe remove base dependency
// login required before doing other scripting functions
// token automatically cached to token module
function loginAsync(){
  return new Promise( (resolve, reject)=>{
    var credentials = promptForCredentials();
    console.log('login credentials:',JSON.stringify(credentials, null, 2));

    base.pxRequest({url: credentials.endpoint + '/info'})
    .then(result=>{
      var infoBody = typeof result.body == 'string' ? JSON.parse(result.body) : result.body;
      var authorizationEndpoint = infoBody.authorization_endpoint + '/oauth/token';
      console.log('info result:',JSON.stringify(result, null, 2));
      console.log('authorization endpoint:', authorizationEndpoint);

      base.pxRequest({
        url: authorizationEndpoint,
          method:'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            Authorization: 'Basic Y2Y6',
          },
          body: `grant_type=password&password=${credentials.password}&scope=&username=${credentials.user}`,
      })
      .then(result => {
        console.log('login success:', result.body);
        var aToken = typeof result.body == 'string' ? JSON.parse(result.body) : result.body;
        token.set(aToken);
        resolve(result);
      })
      .catch(error => {
        console.log('login error:', error);
        reject(error);
      });
    })
    .catch(reject);
  });
}
*/


module.exports = {initSync, getConfig, writeConfigSync};
