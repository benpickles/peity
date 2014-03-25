# Peity

[![Build Status](https://travis-ci.org/benpickles/peity.svg?branch=master)](https://travis-ci.org/benpickles/peity)

Peity (sounds like deity) is a simple jQuery plugin that converts an element's content into a simple mini `<svg>` pie, line or bar chart.

## Basic Usage

### HTML

```html
<span class="pie">3/5</span>
<span class="line">3,5,1,6,2</span>
<span class="bar">2,5,3,6,2,1</span>
```

### Javascript (jQuery)

```js
$("span.pie").peity("pie");
$("span.line").peity("line");
$("span.bar").peity("bar");
```

## Docs

More detailed usage can be found at [benpickles.github.io/peity](http://benpickles.github.io/peity/).

## Copyright

Copyright 2009-2014 [Ben Pickles](http://benpickles.com/). See [MIT-LICENCE](https://github.com/benpickles/peity/blob/master/MIT-LICENCE) for details.
