var Buffer = require('buffer').Buffer;

var properties = [{
    name: 'title',
    type: 'string'
  }, {
    name: 'showtype',
    type: 'number'
  }, {
    name: 'contenttype',
    type: 'number'
  }, {
    name: 'noticetype',
    type: 'number'
  }, {
    name: 'responsetype',
    type: 'number'
  }, {
    name: 'priority',
    type: 'number'
  }, {
    name: 'delayWhileIdle',
    type: 'number'
  }, {
    name: 'collapseKey',
    type: 'string'
  }, {
    name: 'publishtime',
    type: 'number'
  }, {
    name: 'expiry',
    type: 'number'
  }, {
    name: 'parameter',
    type: 'string'
  }, {
    name: 'important',
    type: 'number'
  }, {
    name: 'text',
    type: 'number'
  },
]
/**
 * Create notification
 */
var Notification = function() {
  this.payload = {};
  this.expiry = 0;
  this.identifier = 0;
  this.device;
};

/**
 * JSON serialization
 */
Notification.prototype.toJSON = function() {
  var self = this;
  if (this.payload === undefined)
    this.payload = {};

  if (this.payload.cmns === undefined) {
    this.payload.cmns = {};
  }

  properties.forEach(function(property) {
    if (typeof self[property.name] === property.type) {
      self.payload.cmns[property.name] = self[property.name];
    }
  });

  return this.payload;
};

module.exports = Notification;