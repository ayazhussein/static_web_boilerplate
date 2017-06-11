var gulp = require("gulp");
var postcss = require("gulp-postcss");
var sass = require("gulp-sass");
var autoprefixer = require('autoprefixer');
var flexbugsFixes = require("postcss-flexbugs-fixes");
var sourcemaps = require('gulp-sourcemaps');
var browserSync = require('browser-sync');
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var gulpIf = require('gulp-if');
var concat = require('gulp-concat');
var uncss = require('gulp-uncss');
var cssnano = require('gulp-cssnano');
var imagemin = require('gulp-imagemin');
var cache = require('gulp-cache');
var del = require('del');
var runSequence = require('run-sequence');
var uncache = require("gulp-uncache");

// Development Tasks
// -----------------

// Start browserSync server
gulp.task('browserSync', function () {
    browserSync({
        server: {
            baseDir: 'src'
        }
    })
});
// sass
gulp.task('sass', function () {
    var plugins = [
        autoprefixer({ browsers: ['last 2 version'] }),
        flexbugsFixes
    ];
    return gulp.src('src/scss/**/*.scss') // Gets all files ending with .scss in app/scss and children dirs
        .pipe(sass({
            includePaths: ["./node_modules/bootstrap/scss"]
        }).on('error', sass.logError)) // Passes it through a gulp-sass, log errors to console
        .pipe(postcss(plugins))
        .pipe(gulp.dest('src/css')) // Outputs it in the css folder
        .pipe(browserSync.reload({ // Reloading with Browser Sync
            stream: true
        }));
});

// Just moves the bootstrap js to src/js folder
gulp.task('vendor', function () {
    return gulp.src([
        "node_modules/bootstrap/dist/js/bootstrap.min.js",
        "node_modules/jquery/dist/jquery.min.js",
        "node_modules/tether/dist/js/tether.min.js"])
        .pipe(gulp.dest("src/js"));
});
// Watchers
gulp.task('watch', function () {
    gulp.watch(['node_modules/bootstrap/scss/bootstrap.scss', 'src/scss/**/*.scss'], ['sass']);
    gulp.watch('src/*.html', browserSync.reload);
    gulp.watch('src/js/**/*.js', browserSync.reload);
});

// Optimization Tasks
// ------------------

// Optimizing CSS and JavaScript
gulp.task('useref', function () {

    return gulp.src('src/*.html')
        .pipe(useref())
        .pipe(gulpIf('*.js', uglify()))
        .pipe(gulpIf('*.css', uncss({
            html: ['src/**/*.html']
        })))
        .pipe(gulpIf('*.css', cssnano()))
        .pipe(uncache())
        .pipe(gulp.dest('dist'));
});

// Optimizing Images
gulp.task('images', function () {
    return gulp.src('src/assets/**/*.+(png|jpg|jpeg|gif|svg)')
    // Caching images that ran through imagemin
        .pipe(cache(imagemin({
            interlaced: true,
        })))
        .pipe(gulp.dest('dist/assets'))
});

// Copying fonts
gulp.task('fonts', function () {
    return gulp.src('src/fonts/**/*')
        .pipe(gulp.dest('dist/fonts'))
})

// Cleaning
gulp.task('clean', function () {
    return del.sync('dist').then(function (cb) {
        return cache.clearAll(cb);
    });
})

gulp.task('clean:dist', function () {
    return del.sync(['dist/**/*', '!dist/images', '!dist/images/**/*']);
});

// Build Sequences
// ---------------

gulp.task('default', function (callback) {
    runSequence(['vendor','sass', 'browserSync'], 'watch',
        callback
    )
});

gulp.task('build', function (callback) {
    runSequence(
        'clean:dist',
        'sass',
        ['useref', 'images', 'fonts'],
        callback
    )
});
