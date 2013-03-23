/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },
    s3: {
      // This is specific to MinnPost
      //
      // These are assumed to be environment variables
      // See https://npmjs.org/package/grunt-s3
      //
      // export AWS_ACCESS_KEY_ID=aws-key-goes-here
      // export AWS_SECRET_ACCESS_KEY=aws-secret-goes-here
      //
      // DO NOT COMMIT THE KEY OR SECRET!!!!
      //
      //key: 'YOUR KEY',
      //secret: 'YOUR SECRET',
      bucket: 'data.minnpost',
      access: 'public-read',
      upload: [
        {
          src: 'images/*',
          dest: 'projects/<%= pkg.title %>/images/'
        },
        {
          src: 'data/*',
          dest: 'projects/<%= pkg.title %>/data/'
        }
      ]
    }
  });
  
  // Load plugin tasks
  grunt.loadNpmTasks('grunt-s3');

  // Default task.
  grunt.registerTask('mp-deploy', 's3');

};
