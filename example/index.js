var cmns = require('../index.js'),
  fs = require('fs'),
  options, connection, notification;

var keyName = process.argv[2] || 'dim';

console.log('keyName: ', keyName);

var options = {
  keyData: fs.readFileSync('./key/' + keyName + '/client-key.pem'),
  certData: fs.readFileSync('./key/' + keyName + '/client-cert.pem'),

  rejectUnauthorized: true,
  // This is necessary only if the server uses the self-signed certificate
  caData: [fs.readFileSync('./key/' + keyName + '/ca-cert.pem')],
  debug: true,
  gateway: "127.0.0.1",
  port: 8000,
  errorCallback: errorCallback
};

/*
var options = {
  rejectUnauthorized: true,
  pfx: fs.readFileSync('./key/laiwang_apn_rc.p12'),
  passphrase: 'ken123',
  debug: true,
  errorCallback: errorCallback,
};
*/
/*
var options = {
  rejectUnauthorized: true,
  pfx: fs.readFileSync('./key/yunos_apn.p12'),
  passphrase: 'ken123',
  debug: true,
};
*/
var connection = new cmns.Connection(options);

var goodToken = '01F82C22035CC1D00160FF152E72DF3E94'; 
notification = new cmns.Notification(),
device = new cmns.Device(goodToken);

notification.device = device;
notification.payload = {
  "description": "A good news !",
  //'text': 'c56cbe88f21d6fee4e860f003435bcb1e2f61d96a720da87a1ff07cc56cbe88f21d6febd342efbde4e860f003435bcb1e2f61d96a720da87a1ff07cc56cbe88f21d6febd342efbde4e860f003435bcb1e2f61d96a720da87a1ff07cc56cbe88f21d6febd342efbde4e860f003435bcb1e2f61d96a720da87a1ff07cc56cbe88f21d6febd342efbde4e860f003435bcb1e2f61d96a7'
};
notification.badge = 1;
notification.sound = "dong.aiff";
notification.alert = "发工资了!";

connection.sendNotification(notification);

function errorCallback(errorCode, notification) {
  console.log('errorCode: ', errorCode);
  console.log('notification: ', notification);
}