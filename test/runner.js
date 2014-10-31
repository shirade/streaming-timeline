var Mocha = require('mocha');
var mocha = new Mocha;

mocha.addFile(__dirname + '/socketio');
mocha.addFile(__dirname + '/db');
mocha.addFile(__dirname + '/index');

mocha.run(function(failures){
  process.on('exit', function () {
    process.exit(failures);
  });
});