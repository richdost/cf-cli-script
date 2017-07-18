
var process = require('process');
var uuid = require('uuid');
var util = require('./util.js');
var cleanArray = util.cleanArray;
var cmdSync = util.cmdSync;
var readlineSync = util.readlineSync;

var cfConfig = require('./cfConfig.js');

// require the cf cli to be present
try {
  cfConfig.initSync();
}
catch (e){
  console.log(util.goRed + e + util.goNormal);
  process.exit(1);
}

// facade to util.cmd adding logging
var commandCounter = 1;
var zebraToggle = true;
var zebraColors = {true: util.goCyan, false: util.goBrown};
function getZebra(){
  zebraToggle = !zebraToggle;
  return zebraColors[zebraToggle];
}
function getCommandCount(){ return commandCounter++; }
function cmd(s){
  var commandNumber = getCommandCount();
  console.log(util.goGreen + 'Doing command #' + commandNumber + ': ' + s + util.goNormal);
  return new Promise((resolve, reject) => {
    util.cmd(s)
    .catch(result => {  // result is {command, error, stdout, stderr}
      console.log(util.goRed);
      console.log('--- error command #' + commandNumber + ' ---');
      console.log(result.command);
      if (result.error) console.log('error: ' + result.error);
      if (result.stderr) console.log('stderr: ' + result.stderr);
      if (result.stdout) console.log('stdout: ' + result.stdout);
      console.log('--- end of error command and result ---' + util.goNormal);
      reject(result.error);
    })
    .then(result => {  // result is {command, stdout}
      console.log(getZebra());
      console.log('--- command #' + commandNumber + ' ---');
      console.log(result.command);
      console.log(result.stdout);
      console.log('--- end of command and result ---' + util.goNormal);
      resolve(result.stdout);
    });
  });
}

function setEnv(appName,name,value){
  return new Promise((resolve, reject) => {
    cmd(`cf set-env ${appName} ${name} '${value}'`)
    .catch(reject)
    .then(output => {
            console.log('cf set-env output:\n' + output);

      var rows = output && output.split('\n');
      var isOK = rows && rows[1] && rows[1].startsWith('OK');
      if (isOK) resolve();
      else reject();
    });
  });
}


function getEnv(appName){
  return new Promise((resolve, reject) => {
    cmd('cf env ' + appName)
    .catch(reject)
    .then(output => {
            console.log('cf set-env output:\n' + output);
      var rows = output && output.split('\n');
      var isOK = rows && rows[1] && rows[1].startsWith('OK');
      if (isOK) resolve(output);
      else reject(output);
    });
  });
}

function startApp(appName){
  return new Promise((resolve, reject) => {
    cmd('cf start ' + appName)
    .catch(reject)
    .then(output => {
      var rows = output && output.split('\n');
      resolve(rows && rows[1] && rows[1].startsWith('OK'));
    });
  });
}

// function stop



function loginSync(endpoint, org, user,password=null){
  var s = 'cf login';
  s = endpoint ? s + ' -a "' + endpoint + '"' : s;
  s = user ? s + ' -u "' + user + '"'  : s;
  s = org ? s + ' -o "' + org + '"'  : s;
  s = password ? s + ' -p "' + password + '"'  : s;
  var output = cmdSync(s);
  //console.log('loginSync output:' + output);
  return output && output.indexOf('OK')
}


// Equivalent to cf s.
function getServicesSync(){
  var output = cmdSync('cf s');
  var rows = output.split('\n');
  if (!rows[0].startsWith('Getting services in org ')) throw new Error('Unexpected output - cf version change?');
  rows.forEach((aRow, i) => {
    rows[i] = cleanArray(aRow.split(/\s/));
  });

  var org = rows[0][4];
  var space = rows[0][7];

  var service = [];
  var tableOfServices = cleanArray(rows.slice(4));
  tableOfServices.forEach(aService => {
    service.push({
      instance: aService[0],  // TODO change instance to name
      name: aService[0],
      service: aService[1],
      plan: aService[2],
    });
  });
  return {
    org,
    space,
    service,
  };
}

// Equivalent to cf s.
function getServices(){
  return new Promise((resolve, reject) => {
    // console.log('entering getServices');
    cmd('cf s')
    .catch(error => {
      // console.log('Error in getServices:' + error);
      reject(error);
    })
    .then(output => {
      // console.log('in then clause of getServices');
      var rows = output.split('\n');
      if (!rows[0].startsWith('Getting services in org ')){
        reject('Unexpected output - cf version change?');
        return;
      }
      rows.forEach((aRow, i) => {
        rows[i] = cleanArray(aRow.split(/\s/));
      });

      var org = rows[0][4];
      var space = rows[0][7];

      var service = [];
      var tableOfServices = cleanArray(rows.slice(4));
      tableOfServices.forEach(aService => {
        service.push({
          instance: aService[0],  // TODO change instance to name
          name: aService[0],
          service: aService[1],
          plan: aService[2],
        });
      });
      // console.log('resolving getServices');
      resolve({org, space, service});
    });

  });
}

// Equivalent to cf a
// TODO rename to getAppsInfo
// TODO return map instead of array
function getApps(){
  return new Promise((resolve, reject) => {

    cmd('cf a').catch(reject).then(output => {
      if (!output){
        reject('Unexpected output - error?');
        return;
      }
      var rows = output.split('\n');
      if (!rows[0].startsWith('Getting apps in org ')){
        reject('Unexpected output - cf version change?');
        return;
      }
      rows.forEach(function(aRow, i){
        rows[i] = cleanArray(aRow.split(/\s/));
      });  // TODO map?

      var org = rows[0][4];
      var space = rows[0][7];

      var app = [];
      var tableOfApps = cleanArray(rows.slice(4));
      tableOfApps.forEach(anApp => {
        app.push({
          name: anApp[0],
          state: anApp[1],
          instances: anApp[2],
          memory: anApp[3],
          disk: anApp[4],
          url: anApp[5],
        });
      });

      resolve({org, space, app});
    });
  });
}

function getAppsSync(){
  var output = cmdSync('cf a');
  if (!output) throw new Error('Unexpected output - error?');
  var rows = output.split('\n');
  if (!rows[0].startsWith('Getting apps in org ')) throw new Error('Unexpected output - cf version change?');
  rows.forEach(function(aRow, i){
    rows[i] = cleanArray(aRow.split(/\s/));
  });  // TODO map?

  var org = rows[0][4];
  var space = rows[0][7];

  var app = [];
  var tableOfApps = cleanArray(rows.slice(4));
  tableOfApps.forEach(anApp => {
    app.push({
      name: anApp[0],
      state: anApp[1],
      instances: anApp[2],
      memory: anApp[3],
      disk: anApp[4],
      url: anApp[5],
    });
  });
  return {org, space, app};
}


// Options can include longer name below or directly per cf help push.
// Additional options include "app-only" and "clean".
//
// Single character options are always prefixed with single dash.
// Longer names are first converted to single characters per table below.
// If still long (not in table) then double dash is used.
// Pass null for value or an empty string for options with no value.
// Example:  sdk.scripting.push('my-app',{ path: '~/temp.html','no-start':null });
//
// NOTE:: The path should point to the directory, not to e.g. an html file itself.
function getPushOptionsString(options){
  const singleTermOption = {
    'no-start': true,
    'no-manifest': true,
    'random-route': true,
    'no-hostname': true,
    'no-route': true,
  };
  const optionTranslation = {
    hostname: 'n',
    'docker-image': 'o',
    buildpack: 'b',
    command: 'c',
    manifest: 'f',
    instances: 'i',
    path: 'p',
    disk: 'k',
    stack: 's',
    health: 'u',
    domain: 'd',
    memory: 'm',
    timeout: 't',
  };
  var optionString = '';
  for (var key in options){
    var value = singleTermOption[key] ? '' : options[key];
    if (optionTranslation[key]) key = optionTranslation[key];
    var dashes = key.length == 1 ? '-' : '--';
    optionString += ' ' + dashes + key + ' ' + value;
  }
  return optionString;
}

function pushSync(name, options){
  var optionString = getPushOptionsString(options);
  return cmdSync(`cf push ${name} ${optionString}`, options.timeout ? options.timeout : 120000);
}

function push(name, options = {}){
  var optionString = getPushOptionsString(options);
  return cmd(`cf push ${name} ${optionString}`);
}

//  cmdSync(`cf create-service predix-uaa ${uaa.plan} ${uaa.name} -c '{"adminClientSecret":"${uaa.secret}"}'`);
//  cmdSync(`cf create-service predix-asset ${asset.plan} ${asset.name} -c '{"trustedIssuerIds":["${uaa.issuerId}"]}'`);

// Options are -c and -t. See cf help create-service for details
// When creating a UAA the -c should be something like { adminClientSecret: "secret" }
// For predix-asset the -c { trustedIssuerIds: [ "myUaaUrl" ]}

function createServiceSync(serviceName, plan, instanceName, options = {}){
  // console.log('entering cfScript.createServiceSync for serviceName:' + serviceName);
  // console.log('entering cfScript.createServiceSync for options:' + options);

  // errors
  // TODO handle these in cf-formation. Should not know about service specifics here.
  if (serviceName == 'predix-uaa' && !(options.c && options.c.adminClientSecret)){
    throw new Error('Service predix-uaa requires options.c = { adminClientSecret: <secret> }');
  }
  if (serviceName == 'predix-asset' && !(options.c && options.c.trustedIssuerIds)){
    throw new Error('Service predix-asset requires options.c = { trustedIssuerIds: [ <uaa-url> ]}');
  }

  var cOption = options.c ? "-c '" + JSON.stringify(options.c) + "'" : '';
  var tOption = options.t ? "-t '" + JSON.stringify(options.t) + "'" : '';

  var s = `cf create-service ${serviceName} ${plan} ${instanceName} ${cOption} ${tOption}`;
  var output = cmdSync(s);
  var rows = output && output.split('\n');
  return rows && rows[1] && rows[1].startsWith('OK');
}

// TODO unit tests
function createService(serviceName, plan, instanceName, options = {}){

  // console.log('entering cfScript.createService for serviceName:' + serviceName);

  // errors
  // TODO handle these in cf-formation. Should not know about service specifics here.
  if (serviceName == 'predix-uaa' && !(options.c && options.c.adminClientSecret)){
    return Promise.reject('Service predix-uaa requires options.c = { adminClientSecret: <secret> }');
  }
  if (serviceName == 'predix-asset' && !(options.c && options.c.trustedIssuerIds)){
    return Promise.reject('Service predix-asset requires options.c = { trustedIssuerIds: [ <uaa-url> ]}');
  }

  var cOption = options.c ? "-c '" + JSON.stringify(options.c) + "'" : '';
  var tOption = options.t ? "-t '" + JSON.stringify(options.t) + "'" : '';

  return new Promise((resolve, reject) => {
    cmd(`cf create-service ${serviceName} ${plan} ${instanceName} ${cOption} ${tOption}`)
    .catch(reject)
    .then(output => {
      var rows = output && output.split('\n');
      resolve(rows && rows[1] && rows[1].startsWith('OK'));
    });
  });
}

function deleteAppSync(appName){
  return cmdSync(`cf delete ${appName} -f`);
}

function deleteApp(appName){
  return cmd(`cf delete ${appName} -f`);
}

function deleteServiceSync(serviceName){
  return cmdSync(`cf delete-service ${serviceName} -f`);
}

function deleteService(serviceName){
  return cmd(`cf delete-service ${serviceName} -f`);
}

// TODO return map instead of array
function getServiceInfoSync(serviceName){
  try {
    var keyName = serviceName + '-key-' + uuid.v1();
    cmdSync(`cf create-service-key ${serviceName} ${keyName}`);
    var output = cmdSync(`cf service-key ${serviceName} ${keyName}`);
    cmdSync(`cf delete-service-key ${serviceName} ${keyName} -f`);
    var rows = output.split('\n');
    rows = cleanArray(rows.slice(1));
    var info = rows.join('');
    return JSON.parse(info);
  }
  catch (e) {
    console.log('catch:', e);
    return false;
  }
}

function getServiceInfo(serviceName){
  var keyName = serviceName + '-key';  // + uuid.v1();
  return new Promise((resolve, reject) => {
    cmd(`cf create-service-key ${serviceName} ${keyName}`)
    .catch(reject)
    .then(() => {
      cmd(`cf service-key ${serviceName} ${keyName}`)
      .catch(error =>{
        cmd(`cf delete-service-key ${serviceName} ${keyName} -f`)
        .catch(() => reject(error)).then(() => reject(error));
      })
      .then(output => {
        var rows = output.split('\n');
        rows = cleanArray(rows.slice(1));
        var info = rows.join('');
        info = JSON.parse(info);
        cmd(`cf delete-service-key ${serviceName} ${keyName} -f`)
        .catch(() => resolve(info))
        .then(() => resolve(info));
      });
    });
  });
}

module.exports = {
  loginSync,

  push, pushSync,
  deleteApp, deleteAppSync,

  getApps, getAppsSync, startApp,

  getServices, getServicesSync,
  createService, createServiceSync,
  deleteService, deleteServiceSync,

  getServiceInfo, getServiceInfoSync,

  setEnv, getEnv,


  readlineSync,

  cmd, cmdSync,

};

