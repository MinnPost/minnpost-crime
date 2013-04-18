/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") + "\\n" %>' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */' + 
        '<%= "\\n\\n" %>'
    },
    data_embed: {
      mayoral_candidates: {
        'dist/data.js': ['<%= gss_pull.mayor_data.dest %>']
      }
    },
    jshint: {
      files: ['Gruntfile.js', 'js/*.js']
    },
    clean: {
      folder: 'dist/'
    },
    jst: {
      compile: {
        options: {
          namespace: 'mpApp.<%= pkg.name %>.templates'
        },
        files: {
          'dist/templates.js': ['js/templates/*.html']
        }
      }
    },
    concat: {
      options: {
        separator: '\r\n\r\n'
      },
      dist: {
        src: ['js/maps.js', 'js/charts.js'],
        dest: 'dist/<%= pkg.name %>.<%= pkg.version %>.js'
      },
      dist_latest: {
        src: ['<%= concat.dist.src %>'],
        dest: 'dist/<%= pkg.name %>.latest.js'
      },
      libs: {
        src: ['lib/jquery-1.9.1.min.js', 'lib/underscore-1.4.4.min.js', 'lib/backbone-1.0.0.min.js', 'lib/jquery.jsonp-2.4.0.min.js', 'lib/d3-3.1.5.min.js', 'lib/topojson-1.0.0.min.js', 'lib/simple-map-d3-master-20130410.js'],
        dest: 'dist/<%= pkg.name %>.libs.js',
        options: {
          separator: ';\r\n\r\n'
        }
      }
      /*
      css_libs: {
        src: ['css/lib/jquery.qtip.master-20130221.css'],
        dest: 'dist/<%= pkg.name %>.libs.css',
        separator: '\r\n\r\n'
      }
      */
    },
    uglify: {
      options: {
        banner: '<%= meta.banner %>'
      },
      dist: {
        src: ['<%= concat.dist.dest %>'],
        dest: 'dist/<%= pkg.name %>.<%= pkg.version %>.min.js'
      },
      dist_latest: {
        src: ['<%= concat.dist_latest.dest %>'],
        dest: 'dist/<%= pkg.name %>.latest.min.js'
      }
    },
    copy: {
      dist: {
        files: {
          'dist/<%= pkg.name %>.<%= pkg.version %>.css': 'css/style.css',
          'dist/<%= pkg.name %>.<%= pkg.version %>.ie.css': 'css/style.ie.css'
        }
      },
      dist_latest: {
        files: {
          'dist/<%= pkg.name %>.latest.css': 'css/style.css',
          'dist/<%= pkg.name %>.latest.ie.css': 'css/style.ie.css'
        }
      },
      images: {
        files: [
          {
            cwd: './css/images/',
            expand: true,
            filter: 'isFile',
            src: ['*'],
            dest: 'dist/images/'
          }
        ]
      },
      data: {
        files: [
          {
            cwd: './data/',
            expand: true,
            filter: 'isFile',
            src: ['**/*.json'],
            dest: 'dist/data/'
          }
        ]
      }
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'lint'
    },
    gss_pull: {
      mayor_data: {
        dest: 'data/mayoral_candidates.json',
        src: ['0Amt1xpycNp7OdDYtRUJENTZEamVOby1tY2RHRi1SV1E']
      }
    },
    s3: {
      // This is specific to MinnPost
      //
      // These are assumed to be environment variables:
      //
      // AWS_ACCESS_KEY_ID
      // AWS_SECRET_ACCESS_KEY
      //
      // See https://npmjs.org/package/grunt-s3
      //key: 'YOUR KEY',
      //secret: 'YOUR SECRET',
      bucket: 'data.minnpost',
      access: 'public-read',
      upload: [
        {
          src: ['dist/*'],
          dest: 'projects/<%= pkg.name %>/'
        }
      ]
    }
  });
  
  // Load plugin tasks
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jst');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-gss-pull');
  grunt.loadNpmTasks('grunt-s3');
  

  // Custom task to save json data into a JS file for concatentation
  grunt.registerMultiTask('data_embed', 'Make data embeddable', function() {
    var t, file, output;
    var tasks = this.data; 
    var config = grunt.config.get();
    
    for (t in tasks) {
      file = grunt.file.read(tasks[t][0]);
      output = 'mpApp["' + config.pkg.name + '"].data["' + this.target + '"] = ' + file + ';';
      grunt.file.write(t, output);
      grunt.log.write('Wrote ' + tasks[t][0] + ' to ' + t + '...').ok();
    }
  });
  
  // Data tasks
  grunt.registerTask('data', ['gss_pull', 'data_embed']);

  // Default task.
  grunt.registerTask('default', ['jshint', 'clean', 'jst', 'concat', 'uglify', 'copy']);
  
  // Deploy tasks
  grunt.registerTask('mp-deploy', ['s3']);

};
