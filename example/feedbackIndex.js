var cmns = require('../index.js'),
  fs = require('fs'),
  options, connection, notification;

var keyName = process.argv[2] || 'dim';

var debug = function(message) {};
if (process.env.DEBUG) {
  try {
    debug = require('debug')('apnfb');
  } catch (e) {
    console.log("Notice: 'debug' module is not available. This should be installed with `npm install debug` to enable debug messages", e);
    debug = function() {};
  }
}

var options = {
  keyData: fs.readFileSync('./key/' + keyName + '/client-key.pem'),
  certData: fs.readFileSync('./key/' + keyName + '/client-cert.pem'),

  rejectUnauthorized: true,
  // This is necessary only if the server uses the self-signed certificate
  ca: [fs.readFileSync('./key/' + keyName + '/ca-cert.pem')],
  debug: true,
  address: "127.0.0.1",
  port: 8080,
  errorCallback: errorCallback,
  batchFeedback: false
};

var feedback = new cmns.Feedback(options);

feedback.on('feedback', function(time, device) {
  debug('time: ' + time + ', device: ' + device.toString())
});

function errorCallback(errorCode, notification) {
  debug('errorCode: ', errorCode);
  debug('notification: ', notification);
}