module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // list of files to exclude
    files: [
      '../../node_modules/karma-read-json/karma-read-json.js',
      "../../webapp/libs/jquery/dist/jquery.js",
      "../../webapp/libs/lodash/dist/lodash.min.js",
      "../../webapp/libs/angular/angular.js",
      "../../webapp/libs/angular-route/angular-route.js",
      "../../webapp/libs/bootstrap/dist/js/bootstrap.js",
      "../../webapp/libs/angular-bootstrap/ui-bootstrap.js",
      "../../webapp/libs/angular-bootstrap/ui-bootstrap-tpls.js",
      "../../webapp/libs/angular-animate/angular-animate.js",
      "../../webapp/libs/angular-mocks/angular-mocks.js",
      "../../webapp/libs/ace-builds/src-min-noconflict/ace.js",
      "../../webapp/libs/angular-ui-ace/ui-ace.js",
      "../../webapp/libs/ace-builds/src-min-noconflict/ext-language_tools.js",
      "../../webapp/components/home/HomeViewModule.js",
      "../../webapp/components/services/ResourceProviderService.js",
      "../../webapp/components/services/MessageBoxService.js",
      "../../webapp/components/metering/MeteringViewModule.js",
      "../../webapp/components/metrics/MetricsViewModule.js",
      "../../webapp/components/partials/providerbreadcrumb.js",
      "../../webapp/components/partials/notifications/NotificationService.js",
      "../../webapp/app.routes.js",
      "../../webapp/app.module.js",
      "specs/*.js", {
        pattern: "mock/**/*.json",
        included: false
      }

    ],
    exclude: [

    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      '../../webapp/components/**/*.js': ['coverage']
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'coverage'],

    coverageReporter: {
      type: 'html',
      dir: 'coverage/',
      subdir: '.'
    },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true
  });
}
