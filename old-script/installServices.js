#!/usr/bin/env node

// Not used but keep for eventual comparison

var execSync = require('child_process').execSync;
var readline = require('readline');
var os = require('os');

const access = {
  user: 'dost@ge.com',
  org: 'dost@ge.com',
  endpoint: 'https://api.system.aws-usw02-pr.ice.predix.io',
};

var uaa = {
  secret: 'fubar',
  name: 'dost-uaa',
  plan: 'Free',
};

var asset = {
  secret: 'fubar',
  name: 'dost-asset',
  plan: 'Free',
};

const tempApp = os.tmpdir() + 'tempApp.html';

var goYellow = '\x1b[33m';
var goNormal = '\x1b[0m';
var goCyan = '\x1b[36m';
var goRed = '\x1b[31m';
var goPink = '\x1b[35m';
var goGreen = '\x1b[32m';

// verify prerequisites
if (cmd('cf --version').indexOf('not found') !== -1){
  console.log(goRed + 'Error: cf is not installed.' + goNormal);
  process.exit(1);
}
if (cmd('uaac --version').indexOf('not found') !== -1){
  console.log(goRed + 'Error: uaac is not installed, see https://github.com/cloudfoundry/cf-uaac.' + goNormal);
  process.exit(1);
}

// Get password from environment variable preferably. Else ask.
if (process.env.predix_password) doInstall(process.env.predix_password);
else query('Cloud foundry password:', doInstall);


function doInstall(password){  
  cmd(`cf login -u ${access.user} -p ${password} -o ${access.org} -a ${access.endpoint}`);
  cmd(`cf create-service predix-uaa ${uaa.plan} ${uaa.name} -c '{"adminClientSecret":"${uaa.secret}"}'`);

  // get issuerId of UAA
  cmd(`touch ${tempApp}`);
  cmd(`cf push --no-start -m 1M ${tempApp}`);
  cmd(`cf bs ${tempApp} ${uaa.name}`);
  uaa.env = cmd(`cf env ${tempApp}`); 
  var keyToFind = '"issuerId": "';
  var issuerIdStart = uaa.env.substring(uaa.env.indexOf(keyToFind) + keyToFind.length);
  uaa.issuerId = issuerIdStart.substring(0, issuerIdStart.indexOf('"'));
  console.log(`UAA issuerId: ${goYellow}${uaa.issuerId}${goNormal}`);
  cmd(`cf delete ${tempApp} --f`);

  cmd(`cf create-service predix-asset ${asset.plan} ${asset.name} -c '{"trustedIssuerIds":["${uaa.issuerId}"]}'`);
  
  // get asset instanceId
  cmd(`touch ${tempApp}`);
  cmd(`cf push --no-start -m 1M ${tempApp}`);
  cmd(`cf bs ${tempApp} ${asset.name}`);
  asset.env = cmd(`cf env ${tempApp}`);
  var keyToFind = '"instanceId": "';
  var instanceIdStart = asset.env.substring(asset.env.indexOf(keyToFind) + keyToFind.length);
  asset.instanceId = instanceIdStart.substring(0, instanceIdStart.indexOf('"'));
  console.log('Predix Asset instanceId: ' + goGreen + asset.instanceId + goNormal);
  cmd(`cf delete ${tempApp} --f`);

  // use uaac to get admin token for uaa
  uaa.url = uaa.issuerId.substring(0,uaa.issuerId.indexOf('/oauth/token'));
  cmd(`uaac target ${uaa.url}`);
  cmd(`uaac token client get admin --secret ${uaa.secret}`);

  // add asset as client to uaac
  var authorities = `openid,uaa.none,uaa.resource,predix-asset.zones.${asset.instanceId}.user --scope uaa.none,openid,predix-asset.zones.${asset.instanceId}.user`;
  var grants = 'authorization_code,client_credentials,refresh_token,password';
  cmd(`uaac client add asset-client --authorities ${authorities} --autoapprove openid --authorized_grant_types ${grants} --secret ${asset.secret} --name asset-client`);
  
  // get the token
  cmd(`uaac token client get asset-client --secret ${asset.secret}`); // if token expires then do this again
  cmd(`uaac context`);

  // clean
  // cmd(`cf delete-service ${asset.name} --f`);
  // cmd(`cf delete-service ${uaa.name} --f`);
}

function isCfInstalled(){
  return cmd('cf --version').indexOf('not found') === -1;
}

function isUaacInstalled(){
  return cmd('uaac --version').indexOf('not found') === -1;
}


function cmd(command){
  console.log(goCyan + command + ' ' + goNormal);
  var output = execSync(command).toString();
  if (output){
    console.log(output);
    console.log('---');
  }
  return output; 
}


// callback is invoked with answer
function query(prompt, cb) {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question(goYellow + prompt + ' ' + goNormal, function(answer) {
    rl.close();
    cb(answer);
  });
}
