// karma config for using jasmine framework.
module.exports = function(config) {
  config.set({

    basePath : '../',

    files : [
      'node_modules/jquery/dist/jquery.min.js',
      'src/jquery/*.js',
      'test/jquery/**/*.js',
      // load the html fixtures.
      'test/jquery/fixtures/*.html'
    ],

    autoWatch : true,
    singleRun : true,

    frameworks: ['jasmine-jquery', 'jasmine'],

    browsers : ['Firefox'],

    plugins : [
            'karma-firefox-launcher',
            'karma-mocha-reporter',
            'karma-jasmine',
            'karma-jasmine-jquery'
            ],

    colors : true,

    reporters: ['mocha']
  });
};
