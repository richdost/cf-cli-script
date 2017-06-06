

// tests assume user and endpoint and org are set correctly here or in your env.
// Best to use env for your password.

var args = require('minimist')(process.argv.slice(2));

var org = args.ORG || process.env.ORG || 'dost@ge.com';
var uaaUrl = args.UAA_URL || process.env.UAA_URL || 'https://api.system.aws-usw02-pr.ice.predix.io';
var user = args.USERNAME || process.env.USERNAME || 'dost@ge.com';
var password = args.PASSWORD || process.env.PASSWORD;

if (!(org && uaaUrl && user && password)){
	console.error('Set org, uaaUrl, user and passwordd in your env or in test-settings.js before doing npm test');
	process.exit(1);
}
module.exports = { uaaUrl, org, user, password };
