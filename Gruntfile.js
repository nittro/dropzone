module.exports = function(grunt) {

    var files = grunt.file.readJSON('nittro.json').files;

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        uglify: {
            options: {
                mangle: false,
                sourceMap: false
            },
            dropzone: {
                files: {
                    'dist/js/nittro-extras-dropzone.min.js': files.js
                }
            }
        },

        concat: {
            options: {
                separator: ";\n"
            },
            dropzone: {
                files: {
                    'dist/js/nittro-extras-dropzone.js': files.js
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('default', ['uglify', 'concat']);

};
