cmns
====

cmns is a very effective and resilient CMNS ( Cloud Message Notify Service) interface written in node.js


### Load in the module

  var cmns = require('cmns');

### Exported Objects
- Connection
- Notification
- Device
- Feedback
- Errors

### Connecting
Create a new connection to the cmns gateway server using a dictionary of options. If you name your certificate and key files appropriately (`cert.pem` and `key.pem`) then the defaults should be suitable to get you up and running, the only thing you'll need to change is the `gateway` if you're in the environment.

```javascript
  var options = { "gateway": "gateway.push.yunos.com" };

  var cmnsConnection = new cmns.Connection(options);
```
  
**Important:** In a development environment you must set `gateway` to `gateway.push.yunos.com`.

### Sending a notification
To send a notification first create a `Device` object. Pass it the device token as either a hexadecimal string, or alternatively as a `Buffer` object containing the token in binary form.

  var myDevice = new cmns.Device(token);

Next, create a notification object and set parameters. See the [payload documentation][pl] for more details.

  var note = new cmns.Notification();
  
  note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
  note.badge = 3;
  note.sound = "ping.aiff";
  note.alert = "\uD83D\uDCE7 \u2709 You have a new message";
  note.payload = {'messageFrom': 'Caroline'};
  
  cmnsConnection.pushNotification(note, myDevice);
  


The above options will compile the following dictionary to send to the device:

  {"messageFrom":"Caroline","aps":{"badge":3,"sound":"ping.aiff","alert":"\uD83D\uDCE7 \u2709 You have a new message"}}

#### A note on Unicode.

If you wish to send notifications containing emoji or other multi-byte characters you will need to ensure they are encoded correctly within the string. Notifications can be transmitted to Yunos in either UTF-8 or UTF-16 and strings passed in for the Alert will be converted accordingly. UTF-8 is recommended for most cases as it can represent exactly the same characters as UTF-16 but is usually more space-efficient. When manually encoding strings as above with `\uD83D\uDCE7` the character (in this case a surrogate pair) is escaped in UTF-16 form because Javascript uses UTF-16 internally for Strings but does not handle surrogate pairs automatically.

If in doubt, leave the encoding as default. If you experience any problems raise an issue on GitHub.

### Setting up the feedback service

Yunos recommends checking the feedback service periodically for a list of devices for which there were failed delivery attempts.

Using the `Feedback` object it is possible to periodically query the server for the list. Many of the options are similar to that of `Connection`.

Attach a listener to the `feedback` event to receive the output as two arguments, the `time` returned by the server (epoch time) and a `Buffer` object containing the device token - this event will be emitted for each device separately. Alternatively you can enable the `batchFeedback` option and the `feedback` event will provide an array of objects containing `time` and `device` properties.

  var options = {
    "batchFeedback": true,
    "interval": 300
  };

  var feedback = new cmns.Feedback(options);
  feedback.on("feedback", function(devices) {
    devices.forEach(function(item) {
      // Do something with item.device and item.time;
    });
  });

By specifying a time interval (in seconds) `Feedback` will periodically query the service without further intervention.

**Important:** In a development environment you must set `address` to `feedback.push.Yunos.com`.

More information about the feedback service can be found in the [feedback service documentation][fs].

[pl]: http://ued.aliyun-inc.com/cloudapp/index.php?title=PushMessage
[fs]: https://developer.apple.com/library/ios/#documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/CommunicatingWIthAPS/CommunicatingWIthAPS.html#//apple_ref/doc/uid/TP40008194-CH101-SW3 "Communicating With APS"
