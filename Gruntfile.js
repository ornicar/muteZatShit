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
        tasks: ['default']
      }
    },
    browserify: {
      all: {
        files: {
          'bundle.js': ['src/*.js'],
        },
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('default', ["browserify"]);

};