var gulp = require('gulp'),
    jasmineBrowser = require('gulp-jasmine-browser');

function getNittroFiles(pkg, type) {
    var prefix = pkg ? './node_modules/' + pkg + '/' : './';
    return require(prefix + 'nittro.json').files[type || 'js'].map(function (file) {
        return prefix + file;
    });
}

var files = [
        'node_modules/promiz/promiz.js'
    ]
    .concat(getNittroFiles('nittro-core'))
    .concat(getNittroFiles('nittro-forms'))
    .concat(getNittroFiles())
    .concat('tests/specs/**.spec.js');

gulp.task('test', function () {
    return gulp.src(files, {base: process.cwd()})
        .pipe(jasmineBrowser.specRunner({console: true}))
        .pipe(jasmineBrowser.headless());
});

gulp.task('default', ['test']);
