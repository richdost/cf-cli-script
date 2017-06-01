
var process = require('process');
var uuid = require('uuid');
var util = require('./util.js');
var cleanArray = util.cleanArray;
var cmd = util.cmd;
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

// Equivalent to cf s.
function getServices(){
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

// Equivalent to cf a
// TODO rename to getAppsInfo
// TODO return map instead of array
function getApps(){
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

function push(name, options){
  var optionString = getPushOptionsString(options);
  return cmd(`cf push ${name} ${optionString}`);
}

//  cmdSync(`cf create-service predix-uaa ${uaa.plan} ${uaa.name} -c '{"adminClientSecret":"${uaa.secret}"}'`);
//  cmdSync(`cf create-service predix-asset ${asset.plan} ${asset.name} -c '{"trustedIssuerIds":["${uaa.issuerId}"]}'`);

// Options are -c and -t. See cf help create-service for details
// When creating a UAA the -c should be something like { adminClientSecret: "secret" }
// For predix-asset the -c { trustedIssuerIds: [ "myUaaUrl" ]}
function createService(serviceName, plan, instanceName, options = {}){
  console.log('entering cfScript.createService for serviceName:' + serviceName);
  var configOptionValue = options.c || '';
  var tagOptionValue = options.t || '';
  configOptionValue = typeof configOptionValue == 'string' ? configOptionValue : JSON.stringify(configOptionValue);
  tagOptionValue = typeof tagOptionValue == 'string' ? tagOptionValue : '' + tagOptionValue;

  var configOption = configOptionValue.length ? "-c '" + configOptionValue + "'" : '';
  var tagOption = tagOptionValue.length ? "-t '" + tagOptionValue + "'" : '';

  // errors - TODO handle these in formation
  if (serviceName == 'predix-uaa' && !configOption) throw new Error('Service predix-uaa requires options.c = { adminClientSecret: <secret> }');
  if (serviceName == 'predix-asset' && !configOption) throw new Error('Service predix-asset requires options.c = { trustedIssuerIds: [ <uaa-url> ]}');

  var s = `cf create-service ${serviceName} ${plan} ${instanceName} ${configOption} ${tagOption}`;
  var output = cmdSync(s);
  var rows = output && output.split('\n');
  return rows && rows[1] && rows[1].startsWith('OK');
}


function deleteApp(appName){
  return cmdSync(`cf delete ${appName} -f`);
}


function deleteService(serviceName){
  return cmdSync(`cf delete-service ${serviceName} -f`);
}

// TODO return map instead of array
function getServiceInfo(serviceName){
  try {
    var keyName = 'sdk-temp-key-' + uuid.v1();
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

module.exports = {
  push, pushSync,

  getApps, deleteApp,

  getServices,
  createService,
  deleteService,

  getServiceInfo,

  readlineSync,

  cmd, cmdSync,

};

