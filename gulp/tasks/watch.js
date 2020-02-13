var gulp = require('gulp'),
	watch = require('gulp-watch'),
	browserSync = require('browser-sync').create();

gulp.task('watch', function() {
	browserSync.init({
		notify: false,
		server: {
			baseDir: 'app'
		}
	});

	watch('./app/*.html', function() {
		browserSync.reload();
	});

	watch('./app/src/styles/**/*.css', function() {
		gulp.start('cssInject');
	});

	watch('./app/src/js/**/*.js', function() {
		gulp.start('scriptsRefresh');
	});
});

gulp.task('cssInject', [ 'styles' ], function() {
	return gulp.src('./app/css/styles.css').pipe(browserSync.stream());
});

gulp.task('scriptsRefresh', [ 'scripts' ], function() {
	browserSync.reload();
});
