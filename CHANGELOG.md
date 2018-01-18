# CHANGELOG

## Version 3.3.0 - 2018-01-18

 * Expose an item's value on bar and pie slice SVG nodes on the `data-value` attribute.

## Version 3.2.1 - 2016-10-10

 * Ensure NPM package includes only required files.
 * Now available in Packagist <https://packagist.org/packages/benpickles/peity>.
 * No functional changes.

## Version 3.2.0 - 2015-4-17

 * Add an `after` hook that can be used to decorate a chart.

## Version 3.1.2 - 2015-4-14

 * Allow line charts with no fill, just the line.

## Version 3.1.1 - 2015-2-11

 * Ensure a donut's default inner radius honours percentage dimensions by deriving it from its calculated radius.

## Version 3.1.0 - 2015-1-19

 * Bring back per-chart reading settings from data attributes but with a slightly different interface: all settings are stored on the `data-peity` attribute as JSON.

## Version 3.0.3 - 2015-1-16

 * Don't allow negative or zero values to blow up a pie chart.

## Version 3.0.2 - 2014-10-17

 * Fix `max`/`min` option when it's a string.

## Version 3.0.1 - 2014-10-16

 * jQuery > 1.6.2 doesn’t like `undefined` being passed to `#attr()`.

## Version 3.0.0 - 2014-10-15

 * Remove the ability to read options from data attributes.
 * Add donut chart type.
 * Switch from `diameter` pie chart option to `radius`.
 * Expose the internally-used scale functions to the outside world.
 * Rename `gap` bar chart option to `padding`. It is now specified as a portion of the width of each bar and is present on both sides.

## Version 2.0.5 - 2014-10-15

 * Changes to make the minified version 147 bytes smaller!

## Version 2.0.4 - 2014-10-8

 * Fix a null max argument being calculated as zero when all values are negative.
 * Ensure that a null min argument means that the minimum is calculated from a chart’s values.

## Version 2.0.3 - 2014-4-29

 * Don't blow up drawing a line chart of all zeros.

## Version 2.0.2 - 2014-3-26

 * Fix misaligned bar when its value is negative and equal to the minimum.

## Version 2.0.1 - 2014-1-22

 * Ensure bars are positioned correctly when a bar chart's values are all equal its minimum value.

## Version 2.0.0 - 2014-1-3

 * Switch from `<canvas>` to `<svg>`.
 * Update jQuery dependency from 1.4.4 to 1.6.2 due to problems fetching a `<svg>` element's dimensions in Firefox.
 * Rename `colour`/`colours` options to `fill`.
 * Rename `spacing` bar chart option to `gap`.
 * Rename `strokeColour` line chart option to `stroke`.

## Version 1.2.1 - 2013-11-21

 * Ensure a line chart's outline doesn't spill off the canvas.

## Version 1.2.0 - 2013-3-11

 * Easier CSS targeting of Peity-created canvas elements.
 * Percentage dimensions (`width: "100%"`) now work.

## Version 1.1.2 - 2013-2-23

 * Fix reference to `devicePixelRatio` - thanks [@kcivey](https://github.com/kcivey).

## Version 1.1.1 - 2013-2-5

 * component.json for Bower.
 * Finally in the jQuery plugin registry: <http://plugins.jquery.com/peity/>

## Version 1.1.0 - 2013-2-1

 * Multiple calls to `peity()` on the same element now update the existing chart rather than creating a new one.
 * Zero values in a bar chart are now present as a single-pixel bar.

## Version 1.0.0 - 2012-12-4

 * Spacing between bars can now be configured.
 * Pie charts can now be formed of more than 2 segments.
 * The colours of bar and pie charts can now be set dynamically based on their value.
 * Re-write of the internals so that the actual `<canvas>` element is only created once and `$.wrapInner` is no longer used to contain everything in a separate `<span>`.
 * Peity now automatically reads data-* attributes and passes them as options when instantiating a chart. [@buunguyen](https://github.com/buunguyen)

## Version 0.6.1 - 2012-10-12

 * Workaround for Linux/Chrome bug when using #arc to draw a full circle not having a zero starting angle.

## Version 0.6.0 - 2012-1-27

 * Line and bar charts now support negative numbers.

## Version 0.5.0 - 2011-12-6

 * Fix - rename radius to diameter.
 * Allow line charts with no stroke.
 * Support for iPhone 4 retina display.

## Version 0.4.1 - 2011-9-29

 * For a line graph with a single value show a straight line instead of nothing.

## Version 0.4.0 - 2011-6-30

 * Allow options to be passed a function called with a `this` value of the element in question.

## Version 0.3.5 - 2011-5-12

 * Fix that if the numerator of a pie is zero an empty pie is drawn instead of nothing. [@munikho](https://github.com/munikho)

## Version 0.3.4 - 2011-5-12

 * Remove the little border that appears around the slice of a pie when the slice has a darker colour than the plate. [@munikho](https://github.com/munikho)

## Version 0.3.3 - 2011-3-20

 * Tweaks to aid minification.

## Version 0.3.2 - 2010-5-9

 * Don't blow up if `<canvas>` isn't supported.

## Version 0.3.1 - 2010-5-8

 * Add "strokeWidth" option to line charts.
 * Add "max" option to line and bar chart types.

## Version 0.3.0 - 2010-5-6

 * Add line and bar graph types and expose an interface for adding more. [@ismasan](https://github.com/ismasan) and me.

## Version 0.2.0 - 2010-4-29

First official version. Thanks to [@ismasan](https://github.com/ismasan) and [@olivernn](https://github.com/olivernn) for adding support for the "change" event and making it work in Firefox respectively.

## Birthday - 2009-11-20

It works!
