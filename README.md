# Gulp Angular Inline #

## Overview ##

A Gulp plugin which inlines HTML and CSS on Angular components. Works for both JavaScript and TypeScript files.

The actual parsing of templates is based on the approach taken by the Angular Material theme in the [angular/material2](https://github.com/angular/material2) respository.

## Installation ##

``` bash
$ npm install --save-dev @amd-core/gulp-angular-inline
```

## Usage ##

### Configuration File ###

#### gulpfile.js ####
``` javascript
const path = require('path');
const gulp = require('gulp');
const angularInline = require('@amd-core/gulp-angular-inline');

// parse Angular TypeScript component files,
// the following globs will also work:
// **/*.component.js
// **/*.ts
// **/*.js
// **/*metadata.json
gulp.task('default', () => {
  gulp.src('./src/**/*.component.ts')
    .pipe(angularInline({
      basePath: path.resolve('src'), // basePath is required
      fileExts: ['html', 'css'] // optional, this is the default
    }))
    .pipe(gulp.dest('./build'));
});

```

### Example Files ###

#### src/hello-world.component.html ####
``` html
<div>
  Hello World
</div>
```

#### src/hello-world.component.ts ####
``` javascript
import { Component } from '@angular/core';

@Component({
  selector: 'hello-world',
  templateUrl: './hello-world.component.html'
})
export class HelloWorldComponent {
  public sayHello(): void {
    console.log('Hello World');
  }
}
```

### Resulting Files ###

#### build/hello-world.component.ts ####
``` javascript
import { Component } from '@angular/core';

@Component({
  selector: 'hello-world',
  template: "<div> Hello World </div>"
})
export class HelloWorldComponent {
  public sayHello(): void {
    console.log('Hello World');
  }
}
```

## Todo ##

- [ ] Support HTML minifier
- [ ] Support CSS minifier
- [ ] Support preprocessors for LESS & CSS support
