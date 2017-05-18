const gulp = require('gulp');
const path = require('path');
const angularInline = require('../');

gulp.task('source', () => {
  gulp.src('./src/**/*.ts')
    .pipe(angularInline({
      basePath: path.resolve('src')
    }))
    .pipe(gulp.dest('./build'));
});

gulp.task('metadata', () => {
  gulp.src('./src/**/*metadata.json')
    .pipe(angularInline({
      basePath: path.resolve('src')
    }))
    .pipe(gulp.dest('./build'));
});
