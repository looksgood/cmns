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

   if (this.payload.cmns === undefined) {
      this.payload.cmns = {};
   }


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

module.exports = Notification;