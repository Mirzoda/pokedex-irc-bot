var gulp = require("gulp");
var babel = require("gulp-babel");
var newer = require('gulp-newer');
//var uglify = require("gulp-uglify");

gulp.task("default", ["build-js", "move-data"]);

gulp.task("build-js", function () {

    return gulp.src("src/**/*.js")
        .pipe(babel())
        //.pipe(uglify())
        .pipe(gulp.dest("dist"));

});

gulp.task("move-data", function () {

    return gulp.src("src/data/**/*")
        .pipe(newer("dist/data"))
        .pipe(gulp.dest("dist/data"));

});