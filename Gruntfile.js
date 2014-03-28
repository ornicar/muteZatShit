module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    // jshint: {
    //   all: {
    //     src: ['src/*.js']
    //   }
    // },
    watch: {
      all: {
        files: ['src/*.js'],
        tasks: ['browserify']
      },
      options : {
        livereload: true
      },
      html : {
        files: ["index.html"]
      }
    },
    browserify: {
      all: {
        files: {
          'bundle.js': ['src/*.js'],
        },
      }
    },
    connect: {
      server: {
        options: {
          port: 9000,
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-connect');

  grunt.registerTask('default', ["browserify", "connect", "watch"]);

};