module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    watch: {
      options: {
        livereload: true
      },
      less: {
        files: [
          'src/styles/*.less'
        ],
        tasks: ['less:assets']
      },
      all: {
        files: [
          'src/*.js',
          'src/main.css'
        ],
        tasks: ['browserify']
      },
      html : {
        files: ["index.html"]
      }
    },

    less: {
      options: {
        compress: true
      },
      assets: {
        files: {
          'src/main.css': 'src/styles/main.less'
        }
      }
    },

    browserify: {
      all: {
        files: {
          'bundle.js': ['src/*.js'],
        },
      },
      options : {
        "bundleOptions" : {
          "debug": true
        }
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
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-connect');

  grunt.registerTask('default', ["less", "browserify", "connect", "watch"]);

};
