var arr = //[1, 2, 3];

if (Object.prototype.toString.call(arr) === '[object Array]') {
  console.log('is arr');
} else {
  console.log(arr + ' is not array')
}
console.log('Array.isArray(arr): '+ Array.isArray(arr));
