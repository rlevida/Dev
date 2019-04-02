var gulp = require('gulp');
var concat = require('gulp-concat');
var cleanCSS = require('gulp-clean-css');
var uglify = require('gulp-uglify');

var fileSources = {
    vendorJavascripts: {
        sources: [
            "node_modules/jquery/dist/jquery.min.js",
            "node_modules/bootstrap/dist/js/bootstrap.min.js",
            "node_modules/toastr/build/toastr.min.js",
            "node_modules/lodash/lodash.min.js",
            "node_modules/moment/moment.js",
            "node_modules/bootstrap-validator/dist/validator.js",
            "public/javascripts/function.js",
            "public/javascripts/picker.js",
            "node_modules/react-mentions/lib/Highlighter.js"
        ]
    },
    vendorCSS: {
        sources: [
            "node_modules/bootstrap/dist/css/bootstrap.min.css",
            "node_modules/toastr/build/toastr.css",
            "node_modules/react-select/dist/react-select.css",
            "node_modules/font-awesome/css/font-awesome.min.css",
            "node_modules/react-big-calendar/lib/css/react-big-calendar.css",
            "public/stylesheets/picker.css",
            "node_modules/rc-editor-mention/assets/index.css",
            "node_modules/rc-collapse/assets/index.css"
        ]
    },
    vendorFonts: {
        sources: [
            "node_modules/bootstrap/fonts/**/*",
            "node_modules/font-awesome/fonts/*"
        ]
    }
}

gulp.task("minify-vendor-JS", function () {
    return gulp.src(fileSources.vendorJavascripts.sources)
        .pipe(concat("vendor.js"))
        .pipe(gulp.dest("public/javascripts/"));
});

gulp.task("minify-vendor-CSS", function () {
    return gulp.src(fileSources.vendorCSS.sources)
        .pipe(concat("vendor.css"))
        .pipe(cleanCSS())
        .pipe(gulp.dest("public/stylesheets/"));
});

gulp.task('copy-vendor-fonts', function () {
    return gulp.src(fileSources.vendorFonts.sources).pipe(gulp.dest("public/fonts/"));
});

gulp.task("default", ["minify-vendor-JS", "minify-vendor-CSS", "copy-vendor-fonts"]);