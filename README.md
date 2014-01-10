# Peity

Peity (sounds like deity) is a simple jQuery plugin that converts an element's content into a simple mini `canvas` pie, line or bar chart.

## Basic Usage

### HTML

    <span class="pie">3/5</span>
    <span class="line">3,5,1,6,2</span>
    <span class="bar">2,5,3,6,2,1</span>

### Javascript (jQuery)

    $("span.pie").peity("pie");
    $("span.line").peity("line");
    $("span.bar").peity("bar");
		$("span.multi").peity("lines");

## Docs

More detailed usage can be found at [fmorel90.github.io/peity](http://fmorel90.github.io/peity/).
The original can be found at [benpickles.github.io/peity](http://benpickles.github.io/peity/).

## Copyright

Copyright 2009-2014 [Ben Pickles](http://benpickles.com/). See [MIT-LICENCE](https://github.com/benpickles/peity/blob/master/MIT-LICENCE) for details.
