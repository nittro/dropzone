module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        uglify: {
            options: {
                mangle: false,
                sourceMap: false
            },
            dropzone: {
                files: {
                    'dist/js/nittro-dropzone.min.js': [
                        'src/js/Nittro/Widgets/DropZone.js'
                    ]
                }
            }
        },

        concat: {
            options: {
                separator: ";\n"
            },
            dropzone: {
                files: {
                    'dist/js/nittro-dropzone.js': [
                        'src/js/Nittro/Widgets/DropZone.js'
                    ]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('default', ['uglify', 'concat']);

};
