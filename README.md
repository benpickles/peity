# Peity

Peity (sounds like deity) is a jQuery plugin that converts an element's content into a mini `<svg>` pie, donut, line or bar chart.

## Basic Usage

### HTML

```html
<span class="pie">3/5</span>
<span class="donut">5,2,3</span>
<span class="line">3,5,1,6,2</span>
<span class="bar">2,5,3,6,2,1</span>
```

### JavaScript (jQuery)

```js
$(".pie").peity("pie");
$(".donut").peity("donut");
$(".line").peity("line");
$(".bar").peity("bar");
```

## Docs

More detailed usage can be found at [benpickles.github.io/peity](http://benpickles.github.io/peity/).

## Development

Run the automated tests with:

    npm test

To manually view all test cases run:

    make server

And hit <http://localhost:8080/>.

## Release

Update the version string in `jquery.peity.js`, run `make release`, and follow the instructions.

## Copyright

Copyright 2009-2020 [Ben Pickles](http://benpickles.com/). See [LICENCE](https://github.com/benpickles/peity/blob/master/LICENCE) for details.
