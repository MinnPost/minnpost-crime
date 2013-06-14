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
    /*
    data_embed: {
      bills: {
        'dist/data.js': ['data/bills.json']
      },
    },
    */
    jshint: {
      files: ['Gruntfile.js', 'js/*.js', 'data-processing/*.js']
    },
    sass: {
      dist: {
        options: {
          style: 'compressed'
        },
        files: {
          'css/compiled/main.min.css': 'css/main.scss',
          'css/compiled/main.ie.min.css': 'css/main.scss'
        }
      },
      dev: {
        options: {
          style: 'expanded'
        },
        files: {
          'css/compiled/main.css': 'css/main.scss',
          'css/compiled/main.ie.css': 'css/main.scss'
        }
      }
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
      // JS application
      dist: {
        src: ['js/core.js', 'js/app.js'],
        dest: 'dist/<%= pkg.name %>.<%= pkg.version %>.js'
      },
      dist_latest: {
        src: ['<%= concat.dist.src %>'], dest: 'dist/<%= pkg.name %>.latest.js'
      },
      // CSS application
      dist_css: {
        src: ['css/compiledmain.min.css'], dest: 'dist/<%= pkg.name %>.<%= pkg.version %>.css'
      },
      dist_css_latest: {
        src: ['css/compiledmain.min.css'], dest: 'dist/<%= pkg.name %>.latest.css'
      },
      dist_css_ie: {
        src: ['css/compiled/main.ie.min.css'], dest: 'dist/<%= pkg.name %>.<%= pkg.version %>.ie.css'
      },
      dist_css_latest_ie: {
        src: ['css/compiled/main.ie.min.css'], dest: 'dist/<%= pkg.name %>.latest.ie.css'
      },
      // JS libs
      libs: {
        src: ['components/jquery/jquery.min.js', 'components/jquery-jsonp/src/jquery.jsonp.js', 'components/underscore/underscore-min.js', 'components/backbone/backbone-min.js', 'components/backbone.stickit/backbone.stickit.js', 'components/topojson/topojson.js'],
        dest: 'dist/<%= pkg.name %>.libs.js',
        options: {
          separator: ';\r\n\r\n'
        }
      },
      // CSS libs
      libs_css: {
        src: ['components/flurid/dist/flurid.min.css'], dest: 'dist/<%= pkg.name %>.libs.css'
      },
      libs_css_ie: {
        src: [], dest: 'dist/<%= pkg.name %>.libs.ie.css'
      }
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
    s3: {
      options: {
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
        access: 'public-read'
      },
      mp_deploy: {
        upload: [
          {
            src: 'dist/*',
            dest: 'projects/<%= pkg.name %>/'
          },
          {
            src: 'dist/data/**',
            dest: 'projects/<%= pkg.name %>/data/'
          },
          {
            src: 'dist/images/**',
            dest: 'projects/<%= pkg.name %>/images/'
          }
        ]
      }
    },
    watch: {
      files: ['<%= jshint.files %>', 'css/*.scss'],
      tasks: 'lint-watch'
    }
  });
  
  // Load plugin tasks
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jst');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');
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

  // Default build task
  grunt.registerTask('default', ['jshint', 'sass', 'clean', 'jst', 'concat', 'uglify', 'copy']);

  // Watch dask
  grunt.registerTask('lint-watch', ['jshint', 'sass:dev']);
  
  // Deploy tasks
  grunt.registerTask('mp-deploy', ['s3']);

};
