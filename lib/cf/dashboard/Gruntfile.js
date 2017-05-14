'use strict';
module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      jsFilesForTesting: [
        'src/webapp/libs/jquery/jquery.js',
        'src/webapp/libs/angular/angular.js',
        'src/webapp/libs/angular-route/angular-route.js',
        'src/webapp/libs/angular-sanitize/angular-sanitize.js',
        'src/webapp/libs/angular-mocks/angular-mocks.js',
        'src/webapp/libs/underscore/underscore.js',
        'src/webapp/test/**/*Spec.js',
        'src/webapp/components/**/*.js'
      ]
    },
    karma: {
      development: {
        configFile: 'karma.conf.js',
        options: {
          files: [
            '<%= meta.jsFilesForTesting %>',
            'components/**/*.js'
          ]
        }
      }
    },
    jshint: {
      options: {
        reporter: require('jshint-stylish') // use jshint-stylish to make our errors look and read good
      },
      // when this task is run, lint the Gruntfile and all js files in src
      build: [
        'Gruntfile.js',
        'src/webapp/components/**/*.js'
      ]
    },
    uglify: {
      options: {
        banner: '/*\n <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> \n*/\n',
        beautify: true,
        mangle: true
      },
      build: {
        files: {
          'src/webapp/dist/js/provider.js': 'src/webapp/dist/js/provider.js'
        }
      }
    },
    ngAnnotate: {
      options: {},
      build: {
        files: {
          'src/webapp/dist/js/provider.js': 'src/webapp/dist/js/provider.js'
        }
      }
    },
    concat: {
      options: {
        separator: ';'
      },
      build: {
        files: {
          'src/webapp/dist/js/provider.js': ['src/webapp/components/**/*.js']
        }
      }
    },
    run: {
      server: {
        args: ['node src/server.js --harmony']
      }
    },
    less: {
      development: {
        options: {
          compress: true,
          yuicompress: true,
          optimization: 2
        },
        files: {
          'src/webapp/dist/css/main.css': 'src/webapp/resources/less/*.less'
        }
      }
    },
    watch: {
      set1: {
        files: 'src/webapp/components/**/*.js',
        tasks: ['concat']
      },
      set2: {
        files: 'src/webapp/resources/less/*.less',
        tasks: ['less:development']
      }
    }
  });
  grunt.registerTask('cssCompile', ['less:development']);
  grunt.registerTask('test', ['karma:development']);
  grunt.registerTask('prod', [
    'npm-install',
    /*'jshint',*/
    'concat',
    'ngAnnotate',
    'uglify'
  ]);
  grunt.registerTask('dev', [
    'npm-install',
    /*'jshint',*/
    'concat',
    'ngAnnotate'
  ]);
  grunt.registerTask('serve', [
    /*'jshint',*/
    'concat',
    'ngAnnotate',
    'uglify',
    'less:development'
  ]);
  grunt.registerTask('watchboth', [
    'watch:set1',
    'watch:set2'
  ]);
  grunt.loadNpmTasks('grunt-npm-install');
  grunt.loadNpmTasks('grunt-run');
  grunt.loadNpmTasks('grunt-ng-annotate');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
};
