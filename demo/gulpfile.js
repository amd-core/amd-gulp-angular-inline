const gulp = require('gulp');
const angularInline = require('../');

gulp.task('default', () => {
  gulp.src('./src/**/*.ts')
    .pipe(angularInline())
    .pipe(gulp.dest('./build'));
});
