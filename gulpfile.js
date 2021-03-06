var gulp = require('gulp');
var mocha = require('gulp-mocha');
// jamine runner.
var jasmine = require('gulp-jasmine');

// set the default task.
gulp.task('default', ['unit-test', 'e2e-test']);

// the unit test tasks.
gulp.task('unit-test', ['karma', 'karma.jquery', 'jasmine']);
// the e2e test tasks.
gulp.task('e2e-test', ['protractor', 'express-app-stop']);
// the e2e test with webdrive directly.
gulp.task('wdio-test', ['test:webdriver:jasmine', 'wdio:express-app-stop']);

gulp.task('hello', function() {
  // place code for your default task here
  console.log('Hello Gulp World!');
});

// mocha test runner.
gulp.task('mocha', function() {

  // the src method will locate the source file.
  return gulp.src(['test/mocha/*.js'], {read: false})
    .pipe(mocha({
      reporter: 'spec'
    }));

});

// using mocha to test nodemw lib
gulp.task('mocha.nodemw', function() {

  // the src method will locate the source file.
  return gulp.src(['test/nodemw/*.js'], {read: false})
    .pipe(mocha({
      reporter: 'spec',
      timeout: 5000
    }));

});

// run jasmine test cases.
gulp.task('jasmine', function() {

  return gulp.src('test/jasmine/*.js').pipe(jasmine());
});

// run jasmine jquery test.
// NOTE: This is not working.
//gulp.task('jasmine.jquery', function() {
//
//  return gulp.src('test/jquery/**/*.js').pipe(jasmine());
//});

// try load karm for testing.
var Server = require('karma').server;

gulp.task('karma', function(done) {

    return new Server.start({
        configFile: __dirname + '/test/karma.conf.jasmine.js',
    }, done);
});

gulp.task('karma.jquery', function(done) {

    return new Server.start({
        configFile: __dirname + '/test/karma.conf.jquery.js'
    }, done);
});

// gulp webserver
var webserver = require('gulp-webserver');
//var webserverStream = gulp.src('.').pipe(webserver({
//      host: '0.0.0.0',
//      port: 8900,
//      livereload: true,
//      directoryListing: true,
//      open: true
//    }));

// task
gulp.task('webserver', function() {

    return gulp.src('.').pipe(webserver({
      host: '0.0.0.0',
      port: 8900,
      livereload: true,
      directoryListing: true,
      open: true
    }));
});

// using the express to serve static files.
var gls = require('gulp-live-server');
// the simplest express static server.
//var liveServer = gls.static('.', 8900);
// using a simple javascript file for express server.
var liveServer = gls.new('test/express/simple.js');
gulp.task('express-app', function() {

    liveServer.start();
});

// stop live server after e2e testing are finished.
gulp.task('express-app-stop', ['protractor'], function() {

    liveServer.stop();
});

// stop live server after e2e testing are finished.
gulp.task('wdio:express-app-stop', ['test:webdriver:jasmine'], function() {

    liveServer.stop();
});

// load the protractor.
var protractor = require('gulp-protractor').protractor;
var webdriver_update = require('gulp-protractor').webdriver_update;
var webdriver = require('gulp-protractor').webdriver;

// launch the webdriver.
gulp.task('webdriver_update', webdriver_update);
gulp.task('webdriver', webdriver);

// protractor e2e test will depend on webserver and 
// webdriver task.
gulp.task('protractor', ['express-app', 'webdriver_update', 'webdriver'], function() {

    return gulp.src(['test/protractor/**/*.js']).pipe(protractor({
        configFile: 'test/protractor.conf.js'
    })).on('error', function(e) {
        console.log(e.toString());
        this.emit("end");
    });

});

// using webpack (through webpack-stream) to distribute package.
var webpack = require('webpack-stream');
gulp.task('dist', function() {

    return gulp.src('src/jquery/ui-autocomplete.js')
      .pipe(webpack())
      .pipe(gulp.dest('dist/'));
});

// testing the webdriverio and selenium standalone
var webdirverSingle = require('gulp-webdriver');
gulp.task('test:webdriver', ['selenium'], function() {
    return gulp.src('test/wdio.conf.js').pipe(webdirverSingle({
        //logLevel: 'verbose, command',
        logLevel: 'command',
        waitforTimeout: 12345,
        // only for testing purposes
        cucumberOpts: {
            require: 'nothing'
        },
        reporter: 'spec'
    })).once('end', function() {
        // shutdown the selenium standalone server
        selenium.child.kill();
    });
});

// using jasmine as the test framework.
gulp.task('test:webdriver:jasmine', ['selenium'], function() {
    return gulp.src('test/wdio.conf.jasmine.js').
    pipe(webdirverSingle({
        //logLevel: 'verbose',
        logLevel: 'silent',
        waitforTimeout: 12345,
        // only for testing purposes
        cucumberOpts: {
            require: 'nothing'
        },
        reporter: 'spec'
    })).once('end', function() {
        // shutdown the selenium standalone server
        selenium.child.kill();
    });
});

var selenium = require('selenium-standalone');
gulp.task('selenium', ['express-app'], function (done) {
    selenium.install({
        logger: function (message) { 
            console.log(message);
        }
    }, function (err) {
        if (err) return done(err);

        selenium.start({
           spawnOptions: {
               //stdio: 'inherit'
           }
        }, function (err, child) {
          if (err) return done(err);

          selenium.child = child;
          done();
        });
    });
});

var exit = require('gulp-exit');
gulp.task('clean', ['protractor'], function() {

    gulp.src("").pipe(exit());
});

// testing yahoo stream.
gulp.task('yahoo', function() {

  var stocks = require('yahoo-finance-stream')(
    {frequency: 5000}
  );

  stocks.watch('RHT');
  stocks.watch('FIT');
  stocks.watch('TSLA');

  stocks.on('data', function(stock) {
    console.log('%s: %d', stock.symbol, stock.bid);
  });
});
