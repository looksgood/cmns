var Q = require("q"),
  fs = require('fs');

var keyFile = null//'./key/dim/client-key.pem',
  certFile = './key/dim/client-cert.pem',
  caFile = null//['./key/dim/ca-cert.pem', './key/ca-cert.pem'];

var initializeDeferred = Q.defer();
var caDeferred = Q.defer();

var FileLength = 0,
  fileCount = 0;
if (keyFile)
  FileLength++;
if (certFile)
  FileLength++;
if (caFile)
  FileLength++;

var caFileLength = 0,
  caFileCount = 0;
if (caFile) {
  caFileLength = caFile.length;
}

function init() {
  if (keyFile) {
    fs.readFile(keyFile, function(err, data) {
      if (err) {
        initializeDeferred.reject(err);
        return;
      }
      // console.log('loaded keyFile: ', keyFile);
      keyData = data;
      fileCount++;
      checkFinished(FileLength, fileCount, initializeDeferred);
    }.bind(this));
  }

  if (certFile) {
    fs.readFile(certFile, function(err, data) {
      if (err) {
        initializeDeferred.reject(err);
        return;
      }
      // console.log('loaded certFile: ', certFile);
      certData = data;
      fileCount++;
      checkFinished(FileLength, fileCount, initializeDeferred);
    }.bind(this));
  }

  if (caFile) {
    initCaDate().then(function(data) {
      console.log('data: ', data)
      fileCount++;
      checkFinished(FileLength, fileCount, initializeDeferred);
    }.bind(this), function onError(error) {
      // Handle any error from step1 through step4
      console.log('error: ', error)
    });
  }

  return initializeDeferred.promise;
}

function initCaDate() {
  var caData = [];
  caFile.forEach(function(ca) {
    fs.readFile(ca, function(err, data) {
      if (err) {
        caDeferred.reject(err);
        return;
      }
      // console.log('loaded caFile: ', caFile);
      caData.push(data);
      caFileCount++;
      checkFinished(caFileLength, caFileCount, caDeferred);
    });
  });
  return caDeferred.promise;
}

function checkFinished(length, count, defer) {
  // console.log('length: ' + length + ', count: ' + count);
  if (length === count) {
    defer.resolve('test');
  }
}

init().then(function() {
  console.log('ok~');
  
}, function onError(error) {
  // Handle any error from step1 through step4
  console.log('error: ', error)
});