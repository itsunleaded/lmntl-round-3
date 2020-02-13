var gulp = require('gulp');

gulp.task('font-awesome', function() {
	return gulp.src('./node_modules/font-awesome/fonts/*').pipe(gulp.dest('./app/fonts/font-awesome'));
});

gulp.task('font-univers', function() {
	return gulp.src('./app/src/fonts/font-univers/*').pipe(gulp.dest('./app/fonts/font-univers'));
});
