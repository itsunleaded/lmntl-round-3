var gulp = require('gulp'),
	postcss = require('gulp-postcss'),
	autoprefixer = require('autoprefixer'),
	cssvars = require('postcss-simple-vars'),
	nested = require('postcss-nested'),
	cssImport = require('postcss-import'),
	mixins = require('postcss-mixins'),
	hexrgba = require('postcss-hexrgba');
cssEasing = require('postcss-easings');

gulp.task('styles', function() {
	return gulp
		.src('./app/src/styles/styles.css')
		.pipe(postcss([ cssImport, mixins, cssvars, nested, hexrgba, cssEasing, autoprefixer ]))
		.on('error', function(errorInfo) {
			console.log(errorInfo.toString());
			this.emit('end');
		})
		.pipe(gulp.dest('./app/css'))
		.pipe(gulp.dest('./craft/web/css'));
});
