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
      app_data: {
        options: {
          output: 'dist/data.js'
        },
        files: {
          'neighborhoods/minneapolis.topo': ['data/neighborhoods/minneapolis.topo.json'],
          'cities/cities': ['data/cities/cities.json'],
          'crime/categories': ['data/crime/categories.json']
        }
      }
    },
    jshint: {
      options: {
        curly: true,
        //es3: true,
        forin: true,
        latedef: true,
        //maxlen: 80,
        indent: 2
      },
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
        src: ['js/core.js', 'dist/data.js', 'dist/templates.js', 
          'js/app.js', 'js/models.js', 'js/collections.js', 'js/views.js'],
        dest: 'dist/<%= pkg.name %>.<%= pkg.version %>.js'
      },
      dist_latest: {
        src: ['<%= concat.dist.src %>'], 
        dest: 'dist/<%= pkg.name %>.latest.js'
      },
      // CSS application
      dist_css: {
        src: ['css/compiled/main.min.css'], 
        dest: 'dist/<%= pkg.name %>.<%= pkg.version %>.css'
      },
      dist_css_latest: {
        src: ['css/compiled/main.min.css'], 
        dest: 'dist/<%= pkg.name %>.latest.css'
      },
      dist_css_ie: {
        src: ['css/compiled/main.ie.min.css'], 
        dest: 'dist/<%= pkg.name %>.<%= pkg.version %>.ie.css'
      },
      dist_css_latest_ie: {
        src: ['css/compiled/main.ie.min.css'], 
        dest: 'dist/<%= pkg.name %>.latest.ie.css'
      },
      // JS libs
      libs: {
        src: [
          'components/jquery/jquery.min.js', 
          'components/jquery-jsonp/src/jquery.jsonp.js', 
          'components/underscore/underscore-min.js', 
          'components/backbone/backbone-min.js', 
          'components/backbone.stickit/backbone.stickit.js', 
          'components/topojson/topojson.js', 
          'components/moment/min/moment.min.js',
          'components/leaflet/dist/leaflet.js', 
          'components/chroma-js/chroma.min.js',
          'components/jqplot/excanvas.min.js', 
          'components/jqplot/jquery.jqplot.min.js', 
          'components/jqplot/plugins/jqplot.barRenderer.min.js', 
          'components/jqplot/plugins/jqplot.highlighter.min.js', 
          'components/jqplot/plugins/jqplot.categoryAxisRenderer.min.js'
        ],
        dest: 'dist/<%= pkg.name %>.libs.js',
        options: {
          separator: ';\r\n\r\n'
        }
      },
      // CSS libs
      libs_css: {
        src: [
          'components/flurid/dist/flurid.min.css', 
          'components/leaflet/dist/leaflet.css',
          'components/jqplot/jquery.jqplot.min.css'
        ], 
        dest: 'dist/<%= pkg.name %>.libs.css'
      },
      libs_css_ie: {
        src: ['components/leaflet/dist/leaflet.ie.css'],
        dest: 'dist/<%= pkg.name %>.libs.ie.css'
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
            src: 'dist/data/**/*',
            dest: 'projects/<%= pkg.name %>/data/',
            rel: 'dist/data'
          },
          {
            src: 'dist/images/**/*',
            dest: 'projects/<%= pkg.name %>/images/',
            rel: 'dist/images'
          }
        ]
      }
    },
    connect: {
      server: {
        options: {
          port: 8899
        }
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
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-s3');
  

  // Custom task to save json data into a JS file for concatentation
  grunt.registerMultiTask('data_embed', 'Make data embeddable', function() {
    var options = this.options();
    var config = grunt.config.get();
    var finalOutput = '';
    console.log(options);
    
    this.files.forEach(function(f) {
      var data = grunt.file.readJSON(f.src[0]);
      finalOutput += 'mpApp["' + config.pkg.name + '"].data["' + f.dest + '"] = ' + JSON.stringify(data) + '; \n\n';
      grunt.log.write('Read file: ' + f.src[0] + '...').ok();
      
    });
    
    grunt.file.write(options.output, finalOutput);
    grunt.log.write('Wrote data to: ' + options.output + '...').ok();
  });

  // Default build task
  grunt.registerTask('default', ['jshint', 'sass', 'clean', 'data_embed', 'jst', 'concat', 'uglify', 'copy']);

  // Watch tasks
  grunt.registerTask('lint-watch', ['jshint', 'sass:dev']);
  grunt.registerTask('server-watch', ['connect', 'watch']);
  
  // Deploy tasks
  grunt.registerTask('mp-deploy', ['s3']);

};
