# History

## Version 1.3 - 2014/??/??
 * Add outline to pie chart
 * Add horizontal axis to bar chart
 * Add multi-line chart
 * Add hover outline on pie and bar charts
 * Refactoring to improve minified size
 * Fix flickering when redrawing chart in Firefox

## Version 1.2.1 - 2013/11/21
 * Ensure a line chart's outline doesn't spill off the canvas.

## Version 1.2.0 - 2013/3/11

 * Easier CSS targeting of Peity-created canvas elements.
 * Percentage dimensions (`width: "100%"`) now work.

## Version 1.1.2 - 2013/2/23

 * Fix reference to `devicePixelRatio` - thanks [@kcivey](https://github.com/kcivey).

## Version 1.1.1 - 2013/2/5

 * component.json for Bower.
 * Finally in the jQuery plugin registry: <http://plugins.jquery.com/peity/>

## Version 1.1.0 - 2013/2/1

 * Multiple calls to `peity()` on the same element now update the existing chart rather than creating a new one.
 * Zero values in a bar chart are now present as a single-pixel bar.

## Version 1.0.0 - 2012/12/4

 * Spacing between bars can now be configured.
 * Pie charts can now be formed of more than 2 segments.
 * The colours of bar and pie charts can now be set dynamically based on their value.
 * Re-write of the internals so that the actual `<canvas>` element is only created once and `$.wrapInner` is no longer used to contain everything in a separate `<span>`.
 * Peity now automatically reads data-* attributes and passes them as options when instantiating a chart. [@buunguyen](https://github.com/buunguyen)

## Version 0.6.1 - 2012/10/12

 * Workaround for Linux/Chrome bug when using #arc to draw a full circle not having a zero starting angle.

## Version 0.6.0 - 2012/1/27

 * Line and bar charts now support negative numbers.

## Version 0.5.0 - 2011/12/6

 * Fix - rename radius to diameter.
 * Allow line charts with no stroke.
 * Support for iPhone 4 retina display.

## Version 0.4.1 - 2011/9/29

 * For a line graph with a single value show a straight line instead of nothing.

## Version 0.4.0 - 2011/6/30

 * Allow options to be passed a function called with a `this` value of the element in question.

## Version 0.3.5 - 2011/5/12

 * Fix that if the numerator of a pie is zero an empty pie is drawn instead of nothing. [@munikho](https://github.com/munikho)

## Version 0.3.4 - 2011/5/12

 * Remove the little border that appears around the slice of a pie when the slice has a darker colour than the plate. [@munikho](https://github.com/munikho)

## Version 0.3.3 - 2011/3/20

 * Tweaks to aid minification.

## Version 0.3.2 - 2010/5/9

 * Don't blow up if `<canvas>` isn't supported.

## Version 0.3.1 - 2010/5/8

 * Add "strokeWidth" option to line charts.
 * Add "max" option to line and bar chart types.

## Version 0.3.0 - 2010/5/6

 * Add line and bar graph types and expose an interface for adding more. [@ismasan](https://github.com/ismasan) and me.

## Version 0.2.0 - 2010/4/29

First official version. Thanks to [@ismasan](https://github.com/ismasan) and [@olivernn](https://github.com/olivernn) for adding support for the "change" event and making it work in Firefox respectively.

## Birthday - 2009/11/20

It works!
