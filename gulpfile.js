'use strict';

var gulp = require('gulp'),
    gutil = require('gulp-util'),
    watch = require('gulp-watch'),
    prefixer = require('gulp-autoprefixer'),
    uglify = require('gulp-uglify'),
    sass = require('gulp-sass'),
    plumber = require('gulp-plumber'),
    gcmq = require('gulp-group-css-media-queries'),
    sourcemaps = require('gulp-sourcemaps'),
    rigger = require('gulp-rigger'),
    cssmin = require('gulp-minify-css'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('gulp-pngquant'),
    through = require('through2'),
    favicons = require("gulp-favicons"),
    rimraf = require('rimraf'),
    concat = require('gulp-concat'),
    browserSync = require('browser-sync'),
    svgmin = require('gulp-svgmin'),
    spritesmith = require('gulp.spritesmith'),
    svgSprite = require('gulp-svg-sprite'),
    cheerio = require('gulp-cheerio'),
    replace = require('gulp-replace'),
    clean = require('del');

var path = {
    dist: {
        html: './dist/',
        js: './dist/js/',
        css: './dist/css/',
        img: './dist/img/',
        fav: './dist/img/favicon/',
        fonts: './dist/fonts/',
        spriteSvg: './dist/sprites/',
        spriteImages: './dist/sprites/'
    },
    src: {
        html: './src/*.html',
        js: './src/js/app.js',
        style: './src/style/main.scss',
        img: './src/img/**/*',
        fonts: './src/fonts/*',
        spriteSvg: './src/sprites/svg/*.svg',
        spriteImages: './src/sprites/img/*.png'
    },
    watch: {
        html: './src/**/*.html',
        js: './src/js/**/*.js',
        style: './src/style/**/*.scss',
        img: './src/img/**/*',
        fonts: './src/fonts/*',
        spriteSvg: './src/sprites/svg/*.svg',
        spriteImages: './src/sprites/img/*.png'
    },
};

/* ~~~~~~~~~~~~~~~~~~~~~~~~ clean ~~~~~~~~~~~~~~~~~~~~~~~~*/
gulp.task('clean', function() {
    return clean('./dist/**');
});

/* ~~~~~~~~~~~~~~~~~~~~~~~~ Generate Sprite ~~~~~~~~~~~~~~~~~~~~~~~~*/
gulp.task('spriteImages', function() {
    var spriteData = gulp.src(path.src.spriteImages).pipe(spritesmith({
        algorithm: 'binary-tree',
        padding: 10,
        cssName: 'sprites.scss',
        cssFormat: 'scss',
        imgName: 'sprite.png',
        imgPath: '../sprites/sprite.png',
        cssTemplate: './src/sprites/templates/scss.template.handlebars'
    }));
    spriteData.img.pipe(gulp.dest('./dist/sprites/'));
    spriteData.css.pipe(gulp.dest('./src/sprites/'));
    return spriteData;
});

/* ~~~~~~~~~~~~~~~~~~~~~~~~ Generate Sprite SVG ~~~~~~~~~~~~~~~~~~~~~~~~*/
gulp.task('spriteSvg', function() {
    return gulp
        .src(path.src.spriteSvg)
        .pipe(cheerio({
            run: function($) {
                $('[fill]').removeAttr('fill');
                $('[stroke]').removeAttr('stroke');
                $('[style]').removeAttr('style');
            },
            parserOptions: {
                xmlMode: true
            }
        }))
        .pipe(replace('&gt;', '>'))
        .pipe(svgSprite({
            mode: {
                symbol: {
                    dest: "",
                    prefix: '.',
                    dimensions: '.',
                    sprite: "sprite.svg",
                    render: {
                        scss: {
                            dest: '../../src/sprites/spritesSvg.scss',
                            template: "src/sprites/templates/scss.templateSvg.handlebars"
                        }
                    }
                }
            }

        }))
        .pipe(gulp.dest('dist/sprites/'));
});

/* ~~~~~~~~~~~~~~~~~~~~~~~~ HTML ~~~~~~~~~~~~~~~~~~~~~~~~*/
gulp.task('html', function() {
    gulp.src(path.src.html)
        .pipe(rigger())
        .pipe(gulp.dest(path.dist.html))
        .pipe(browserSync.reload({
            stream: true
        }));
});

/* ~~~~~~~~~~~~~~~~~~~~~~~~ JS ~~~~~~~~~~~~~~~~~~~~~~~~*/
gulp.task('js', function() {
    gulp.src(path.src.js)
        .pipe(rigger())
        .pipe(plumber())
        // .pipe(uglify())
        .pipe(gulp.dest(path.dist.js))
        .pipe(browserSync.reload({
            stream: true
        }));
});

/* ~~~~~~~~~~~~~~~~~~~~~~~~ SCSS Compile ~~~~~~~~~~~~~~~~~~~~~~~~*/
gulp.task('style', function() {
    gulp.src(path.src.style)
        // .pipe(sourcemaps.init())
        .pipe(sass({
            includePaths: ['src/style/'],
            outputStyle: 'compressed',
            sourceMap: true,
            errLogToConsole: true
        }).on('error', function(error) {
            console.log(error);
        }))
        .pipe(prefixer())
        .pipe(gcmq())
        .pipe(cssmin())
        // .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(path.dist.css))
        .pipe(browserSync.reload({
            stream: true
        }));
});

/* ~~~~~~~~~~~~~~~~~~~~~~~~ Optimization images ~~~~~~~~~~~~~~~~~~~~~~~~*/
gulp.task('image', function() {
    gulp.src(path.src.img)
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{
                removeViewBox: false
            }],
            use: [pngquant()],
            interlaced: true
        }))
        .pipe(gulp.dest(path.dist.img))
        .pipe(browserSync.reload({
            stream: true
        }));
});

/* ~~~~~~~~~~~~~~~~~~~~~~~~ Favicons ~~~~~~~~~~~~~~~~~~~~~~~~*/
gulp.task('fav', function() {
    gulp.src('./src/img/favicon.png')
        .pipe(favicons({
            html: '../../../src/template/favicons.html',
            pipeHTML: true,
            replace: true,
            background: 'transparent',
            theme_color: '#000',
            icons: {
                android: true,
                appleIcon: true,
                appleStartup: true,
                coast: {
                    offset: 25
                },
                favicons: true,
                firefox: true,
                windows: true,
                yandex: true
            }
        }))
        .pipe(through.obj(function(file, enc, cb) {
            this.push(file);
            cb();
        }))
        .pipe(gulp.dest(path.dist.fav));
});

/* ~~~~~~~~~~~~~~~~~~~~~~~~ Fonts ~~~~~~~~~~~~~~~~~~~~~~~~*/
gulp.task('fonts', function() {
    gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.dist.fonts))
});

/* ~~~~~~~~~~~~~~~~~~~~~~~~ Watch ~~~~~~~~~~~~~~~~~~~~~~~~*/
gulp.task('watch', function() {

    browserSync.init({
        server: './dist/',
        port: 1000,
        open: false,
        notify: false
    });

    gulp.watch(path.watch.spriteImages, ['spriteImages']);
    gulp.watch(path.watch.spriteSvg, ['spriteSvg']);

    gulp.watch(path.watch.html, ['html']);
    gulp.watch(path.watch.fonts, ['fonts']);
    gulp.watch(path.watch.image, ['image']);
    gulp.watch(path.watch.style, ['style']);
    gulp.watch(path.watch.js, ['js']);

});

/* ~~~~~~~~~~~~~~~~~~~~~~~~ Сделать красиво ~~~~~~~~~~~~~~~~~~~~~~~~*/
gulp.task('default', ['clean'], function() {
    gulp.start(
        'spriteImages',
        'spriteSvg',
        'fonts',
        'image',
        'fav',
        'html',
        'style',
        'js',
        'watch'
    );
});