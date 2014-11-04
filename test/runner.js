var Mocha = require('mocha');
var mocha = new Mocha;

mocha.addFile(__dirname + '/helper');
mocha.addFile(__dirname + '/db');
mocha.addFile(__dirname + '/index');

mocha.run(function(failures){
  process.on('exit', function () {
    process.exit(failures);
  });
});