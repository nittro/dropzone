module.exports = function(grunt) {

    var files = [
        'src/js/Nittro/Extras/DropZone/DropZone.js',
        'src/js/Nittro/Extras/DropZone/Bridges/DropZoneDI.js'
    ];

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        uglify: {
            options: {
                mangle: false,
                sourceMap: false
            },
            dropzone: {
                files: {
                    'dist/js/nittro-extras-dropzone.min.js': files
                }
            }
        },

        concat: {
            options: {
                separator: ";\n"
            },
            dropzone: {
                files: {
                    'dist/js/nittro-extras-dropzone.js': files
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('default', ['uglify', 'concat']);

};
