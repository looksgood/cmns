var fs = require('fs'),
   FileLoader = require("./file-loader").FileLoader,
   tls = require('tls'),
   Errors = require('./errors'),
   extend = require("./util").extend,
   int2buf = require("./util").int2buf,
   bytes2int = require("./util").bytes2int,
   Q = require("q"),
   Buffer = require('buffer').Buffer;


if (typeof fileLoader === "undefined")
   fileLoader = new FileLoader();

/**
 * Create a connection
 * @param object options Options
 */
var Connection = function(options) {
   // Default options
   this.options = {
      certFile: null,
      keyFile: null,
      certData: null,
      keyData: null,
      passphrase: null,
      gateway: "gateway.push.apple.com",
      port: 2195,
      enhanced: true,
      errorCallback: null,
      cacheLength: 1000,
      connectionTimeout: 600000, //10 minutes
      debug: false
   };

   extend(this.options, options);

   this.initialized = false;

   this.cert = undefined;
   this.key = undefined;
   this.passphrase = undefined;

   this.tlsConnection = null;
   this.writeBuffer = [];

   this.initializeDeferred = null;
   this.openSocketDeferred = null;

   this.currentId = 0;
   this.cachedNotifications = [];

   this.connectionTimeoutInterval = null;
};

/**
 * Initialize connection
 */
Connection.prototype.initialize = function() {
   var self = this;
   if (this.initializeDeferred)
      return this.initializeDeferred.promise;
   else
      this.initializeDeferred = Q.defer();

   this.FileLength = 0;
   this.fileCount = 0;

   if (typeof this.options.passphrase === "string")
      this.passphrase = this.options.passphrase;

   if (this.options.pfx) {
      this.pfx = this.options.pfx;
   } else if (this.options.pfxFile) {
      this.FileLength++;
      fileLoader.load(this.options.pfxFile, function(data) {
         // console.log('loaded keyFile: ', keyFile);
         this.pfx = data;
         this.fileCount++;
         this.checkFinished(this.FileLength, this.fileCount, this.initializeDeferred);
      }.bind(this));
   }

   if (this.options.caData && Array.isArray(this.options.caData)) {
      this.ca = this.options.caData;
   } else if (this.options.caFile) {
      this.FileLength++;
      this.initCaDate().then(function() {
         this.fileCount++;
         this.checkFinished(this.FileLength, this.fileCount, this.initializeDeferred);
      }.bind(this), function onError(error) {
         console.log('error: ', error)
      });
   }

   if (this.options.certData) {
      this.cert = this.options.certData;
   } else if (this.options.certFile) {
      this.FileLength++;
      fileLoader.load(this.options.certFile, function(data) {
         self.cert = data;
         self.fileCount++;
         self.checkFinished(self.FileLength, self.fileCount, self.initializeDeferred);
      });
   }

   if (this.options.keyData) {
      this.key = this.options.keyData;
   } else if (this.options.keyFile) {
      this.FileLength++;
      fileLoader.load(this.options.keyFile, function(data) {
         self.key = data;
         self.fileCount++;
         self.checkFinished(self.FileLength, self.fileCount, self.initializeDeferred);
      });
   }

   if (this.FileLength === 0) {
      this.initializeDeferred.resolve();
   }

   return this.initializeDeferred.promise;
};

Connection.prototype.initCaDate = function() {
   var self = this;
   this.caDeferred = Q.defer();
   this.caFile = this.options.caFile || [];
   this.ca = this.ca || [];
   if (!Array.isArray(this.caFile) || this.caFile.length < 1) {
      this.caDeferred.reject('caFile must be Array');
   }


   this.caFileLength = this.caFile.length,
   this.caFileCount = 0;

   this.caFile.forEach(function(ca) {
      fileLoader.load(ca, function(data) {
         // console.log('loaded caFile: ', caFile);
         self.ca.push(data);
         self.caFileCount++;
         self.checkFinished(self.caFileLength, self.caFileCount, self.caDeferred);
      });
   });
   return this.caDeferred.promise;
};

Connection.prototype.checkFinished = function(length, count, defer) {
   // console.log('length: ' + length + ', count: ' + count);
   if (length === count) {
      defer.resolve();
   }
};

Connection.prototype.log = function(message) {
   this.options.debug && console.log("[" + new Date() + "] " + message);
};

/**
 * Open socket
 */
Connection.prototype.openSocket = function() {
   this.log("open socket");

   if (this.tlsConnection !== null && (this.tlsConnection.readyState === "open" || this.tlsConnection.readyState === "opening"))
      return this.openSocketDeferred.promise;
   else {
      if (this.openSocketDeferred)
         return this.openSocketDeferred.promise;
      else
         this.openSocketDeferred = Q.defer();
   }

   this.initialize().then(function() {
      var tlsConnectionOptions = {};

      if (this.ca) {
         tlsConnectionOptions.ca = this.ca;
      }
      if (this.key)
         tlsConnectionOptions.key = this.key;

      if (this.cert)
         tlsConnectionOptions.cert = this.cert;

      if (this.passphrase)
         tlsConnectionOptions.passphrase = this.passphrase;

      if (this.pfx)
         tlsConnectionOptions.pfx = this.pfx;

      var self = this;

      this.tlsConnection = tls.connect(
         this.options['port'],
         this.options['gateway'],
         tlsConnectionOptions, function() {
         if (!this.authorized)
            throw this.authorizationError;

         if (self.connectionTimeoutInterval)
            clearInterval(self.connectionTimeoutInterval);

         self.connectionTimeoutInterval = setTimeout(self.destroyTlsConnection.bind(self), self.options.connectionTimeout);

         self.drain();
         self.openSocketDeferred.resolve();
      });

      this.tlsConnection.on("data", this.handleTransmissionError.bind(this));
      this.tlsConnection.on("error", this.destroyTlsConnection.bind(this));
      this.tlsConnection.on("drain", this.drain.bind(this));
      this.tlsConnection.on("end", this.resetTlsConnection.bind(this));
      this.tlsConnection.once("close", this.resetTlsConnection.bind(this));

   }.bind(this));

   return this.openSocketDeferred.promise;
};

/**
 * Drain notifications
 */
Connection.prototype.drain = function() {
   this.log("drain");

   if (this.tlsConnection && this.tlsConnection.socket.bufferSize !== 0)
      return;

   while (this.writeBuffer.length && this.tlsConnection && this.tlsConnection.socket.bufferSize === 0) {
      this.sendNotification(this.writeBuffer.shift());
   }
};

/**
 * Destroy the connection
 */
Connection.prototype.destroyTlsConnection = function() {
   this.log("destroySoon");

   if (this.tlsConnection) {
      this.tlsConnection.destroySoon();
   }
};

/**
 * Clear the connection
 */
Connection.prototype.resetTlsConnection = function() {
   this.log("clear");

   if (this.tlsConnection)
      this.tlsConnection.removeAllListeners();

   this.tlsConnection = null;
   this.openSocketDeferred = null;

   if (this.writeBuffer.length)
      this.openSocket();
};

/**
 * Notify an error
 * @param number errorCode
 * @param Notification notification
 */
Connection.prototype.notifyError = function(errorCode, notification) {
   if (typeof this.options.errorCallback === 'function')
      this.options.errorCallback(errorCode, notification);
};

/**
 * Catch notification error return by Apple server
 * @param Buffer data Data
 */
Connection.prototype.handleTransmissionError = function(data) {
   if (data[0] == 8) {
      var errorCode = data[1],
         identifier = bytes2int(data.slice(2, 6), 4),
         notification = undefined,
         count,
         i;

      while (this.cachedNotifications.length) {
         notification = this.cachedNotifications.shift();

         if (notification._uid == identifier)
            break;
      }

      this.notifyError(errorCode, notification);

      count = this.cachedNotifications.length;

      for (i = 0; i < count; i++) {
         notification = this.cachedNotifications.shift();
         this.writeBuffer.push(notification);

         this.log("Catch error, add buffer : " + notification.device.token.toString("hex"));
      }

      this.destroyTlsConnection();
   }
};

/**
 * Cache notification
 * @param Notification notification
 */
Connection.prototype.cacheNotification = function(notification) {
   this.cachedNotifications.push(notification);

   if (this.cachedNotifications.length > this.options.cacheLength) {
      this.cachedNotifications.shift();
   }
};

/**
 * Send notification
 * @param Notification notification
 */
Connection.prototype.sendNotification = function(notification) {
   this.log("Send : " + JSON.stringify(notification));

   this.openSocket().then(function() {
      if (this.tlsConnection.socket.bufferSize !== 0 || !this.tlsConnection.writable) {
         this.writeBuffer.push(notification);
         return;
      }

      var encoding = "utf8",
         token = notification.device.token,
         message = JSON.stringify(notification),
         messageLength = Buffer.byteLength(message, encoding),
         pos = 0,
         data;

      if (typeof token === "undefined") {
         this.notifyError(Errors['missingDeviceToken'], notification);
         return;
      }

      if (messageLength > 256) {
         this.notifyError(Errors['invalidPayloadSize'], notification);
         return;
      }

      if (notification.encoding) {
         encoding = notification.encoding;
      }

      notification._uid = this.currentId++;

      if (this.options.enhanced === true) {
         data = new Buffer(1 + 4 + 4 + 2 + token.length + 2 + messageLength);
         data[pos] = 1;
         pos++;

         pos += int2buf(notification._uid, data, pos, 4);

         pos += int2buf(notification.expiry, data, pos, 4);
      } else {
         data = new Buffer(1 + 2 + token.length + 2 + messageLength);
         data[pos] = 0;
         pos++;
      }

      pos += int2buf(token.length, data, pos, 2);
      pos += token.copy(data, pos, 0);
      pos += int2buf(messageLength, data, pos, 2);
      data.write(message, pos, encoding);

      this.cacheNotification(notification);

      this.tlsConnection.write(data);
      this.log("Write : " + notification.device.token.toString("hex"));

   }.bind(this));
};

module.exports = Connection;