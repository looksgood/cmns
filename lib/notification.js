var Buffer = require('buffer').Buffer;

/**
 * Create notification
 */
var Notification = function() {
   this.payload = {};
   this.expiry = 0;
   this.identifier = 0;
   this.device;

   this.alert = undefined;
   this.badge = undefined;
   this.sound = undefined;
};

/**
 * JSON serialization
 */
Notification.prototype.toJSON = function() {
   if (this.payload === undefined)
      this.payload = {};

   if (this.payload.cmns === undefined)
      this.payload.cmns = {
         noticetype: 0,
         responsetype: 0,
         reply: 0,
         priority: 0,
         delayWhileIdle: 1,
         important: 0,
         text: 0
   };

   if (typeof this.badge === "number")
      this.payload.cmns.badge = this.badge;

   if (typeof this.sound === "string")
      this.payload.cmns.sound = this.sound;

   if (typeof this.alert === "string" || typeof this.alert == "object")
      this.payload.cmns.alert = this.alert;

   if (typeof this.title === 'string')
      this.payload.cmns.title = this.title;

   if (typeof this.showtype === "number")
      this.payload.cmns.showtype = this.showtype;

   if (typeof this.contenttype === "number")
      this.payload.cmns.contenttype = this.contenttype;

   if (typeof this.noticetype === "number")
      this.payload.cmns.noticetype = this.noticetype;

   if (typeof this.responsetype === "number")
      this.payload.cmns.responsetype = this.responsetype;

   if (typeof this.contenttype === "number")
      this.payload.cmns.contenttype = this.contenttype;

   if (typeof this.priority === "number")
      this.payload.cmns.priority = this.priority;

   if (typeof this.priority === "number")
      this.payload.cmns.priority = this.priority;

   if (typeof this.delayWhileIdle === "number")
      this.payload.cmns.delayWhileIdle = this.delayWhileIdle;

   if (typeof this.collapseKey === 'string')
      this.payload.cmns.collapseKey = this.collapseKey;

   if (typeof this.publishtime === "number")
      this.payload.cmns.publishtime = this.publishtime;

   if (typeof this.expiry === "number")
      this.payload.cmns.expiry = this.expiry;

   if (typeof this.important === "number")
      this.payload.cmns.important = this.important;

   if (typeof this.text === "number")
      this.payload.cmns.text = this.text;

   return this.payload;
};

/**
 * Device
 * @param mixed deviceToken
 * @param boolean ascii
 */
var Device = function(token) {
   var self = this;
   self.token = undefined;

   self.setToken(token);
};

/**
 * Convert ascii token to Buffer token
 * @param string token
 * @return Buffer
 */
Device.prototype.parseToken = function(token) {
   token = token.replace(/\s/g, "");
   var length = Math.ceil(token.length / 2);
   var hexToken = new Buffer(length);
   for (var i = 0; i < token.length; i += 2) {
      var word = token[i];

      if ((i + 1) >= token.length || typeof(token[i + 1]) === undefined)
         word += '0';
      else
         word += token[i + 1];

      hexToken[i / 2] = parseInt(word, 16);
   }

   return hexToken;
};

/**
 * Set the token
 * @param mixed newToken
 */
Device.prototype.setToken = function(newToken) {
   if (typeof newToken === "string")
      newToken = this.parseToken(newToken);

   this.token = newToken;

   return this;
};

/**
 * Return the hexadecimal token in string
 * @return string
 */
Device.prototype.hexToken = function() {
   var out = [];
   var len = this.token.length;
   var n;
   for (var i = 0; i < len; i++) {
      n = this.token[i];
      if (n < 16) out[i] = "0" + n.toString(16);
      else out[i] = n.toString(16);
   }

   return out.join("");
};

exports.Notification = Notification;
exports.Device = Device;