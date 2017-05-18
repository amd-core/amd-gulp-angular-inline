const gulp = require('gulp');
const angularInline = require('../');

gulp.task('source', () => {
  gulp.src('./src/**/*.ts')
    .pipe(angularInline())
    .pipe(gulp.dest('./build'));
});

gulp.task('metadata', () => {
  gulp.src('./src/**/*metadata.json')
    .pipe(angularInline())
    .pipe(gulp.dest('./build'));
});
