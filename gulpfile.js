// Load plugins
var gulp = require('gulp'),
	sass = require('gulp-ruby-sass'),
	autoprefixer = require('gulp-autoprefixer'),
	minifycss = require('gulp-minify-css'),
	jshint = require('gulp-jshint'),
	uglify = require('gulp-uglify'),
	rename = require('gulp-rename'),
	concat = require('gulp-concat'),
	notify = require('gulp-notify'),
	cache = require('gulp-cache'),
	nodemon = require('gulp-nodemon'),
	react = require('gulp-react'),
	del = require('del');

// Styles
gulp.task('styles', function() {
	return sass('scss/styles.scss', { style: 'expanded' })
	.on('error', function (err) { console.log(err.message); this.end(); })
	.pipe(autoprefixer('last 2 version'))
	.pipe(gulp.dest('css'))
	.pipe(rename({ suffix: '.min' }))
	.pipe(minifycss())
	.pipe(gulp.dest('css'))
	.pipe(notify({ message: 'Styles task complete' }));
});

// Scripts
gulp.task('scripts', function() {
	return gulp.src('src/**/*.js')
	.pipe(react())
	.on('error', function (err) { console.log(err.message); this.end(); })
	.pipe(jshint({ "asi": true }))
	.on('error', function (err) { console.log(err.message); this.end(); })
	.pipe(jshint.reporter('default'))
	.pipe(concat('index.js'))
	.pipe(gulp.dest('js'))
	.pipe(rename({ suffix: '.min' }))
	.pipe(uglify())
	.on('error', function (err) { console.log(err.message); this.end(); })
	.pipe(gulp.dest('js'))
	.pipe(notify({ message: 'Scripts task complete' }));
});

// Clean
gulp.task('clean', function(cb) {
	del(['css', 'js'], cb)
});

// Default task
gulp.task('default', ['clean'], function() {
	gulp.start('styles', 'scripts');
});

// Watch
gulp.task('watch', function() {

	// Watch .scss files
	gulp.watch('scss/**/*.scss', ['styles']);

	// Watch .js files
	gulp.watch('src/**/*.js', ['scripts']);

});