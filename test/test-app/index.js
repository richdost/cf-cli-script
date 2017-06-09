
const express = require('express');
var port = process.env.PORT || 3000;
const app = express();
app.get('/', (req, res) => res.send(formatEnv()));
app.listen(port, () => console.log('listening on ' + port));

function formatEnv(){
  var rtn = [];
  for (var key in process.env) rtn.push( '' + key + ': ' + process.env[key]);
    rtn.sort();
  return rtn.join('<hr/>');
}
