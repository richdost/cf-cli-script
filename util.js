
var execSync = require('child_process').execSync;
var exec = require('child_process').exec;
var readlineSync = require('readline-sync');

var request = require('request');
var extend = require('extend');

const goYellow = '\x1b[33m';
const goNormal = '\x1b[0m';
const goCyan = '\x1b[36m';
const goRed = '\x1b[31m';
const goPink = '\x1b[35m';
const goGreen = '\x1b[32m';
const goBlue = '\x1b[34m';



// Executes command in subprocess. Returns promise that resolves to {command, stdout} or rejects to {command, error, stdout, stderr}.
function cmd(command){
  return new Promise((resolve, reject) => {
    exec(command, function(error, stdout, stderr) {
      if (error) reject({command, error, stdout, stderr});
      else resolve({command, stdout});
    });
  });
}

function cmdSync(command, timeout = 20000){
  //console.log(goCyan + command + ' ' + goNormal);
  var output;
  try {
    output = execSync(command, { timeout: timeout }).toString();
    // if (output){
    //   console.log(output);
    //   console.log('---');
    // }
  }
  catch (e) {
    console.log('error caught with e:' + e);
    console.log(goRed + '-- error --' + '\n' + e.toString() + goNormal);
    if (output) console.log('-- output --' + '\n' + output);
    console.log(goRed + '-- end of error info --' + goNormal);
    return null;
  }
  return output.toString('utf8');
}

function requestP(options){
  var defaultOptions = {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      // 'Pragma': 'no-cache',
      // 'Cache-Control': 'no-cache',
    },
  };
  var combinedOptions = extend(true, {}, defaultOptions, options);
  return new Promise((resolve, reject) => {
    request(combinedOptions, (error, response, body) => {
      if (error) reject(error);
      else {
        body = typeof response.body == 'string' ? JSON.parse(response.body) : response.body;
        resolve(body);
      }
    });
  });
}

// function log(msg){
//   console.log(msg);
// }

// function logWarning(msg){
//   console.log(goYellow + msg + goNormal);
// }

// function logError(msg){
//   console.log(goRed + msg + goRed);
// }

function cleanArray(a){
  var rtn = [];
  a.forEach(elem => elem.length && rtn.push(elem));
  return rtn;
}

module.exports = {
  cleanArray,
  cmd, cmdSync,
  readlineSync,
  goYellow, goNormal, goCyan, goRed, goPink, goGreen, goBlue,
  requestP,
  //log, logWarning, logError,
};
