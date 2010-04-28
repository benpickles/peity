// Peity jQuery plugin
// (c) 2010 Ben Pickles
//
// http://benpickles.github.com/peity/
//
// Released under MIT license.
(function($) {
  $.fn.peity = function(options) {
    var opts = $.extend({}, $.fn.peity.defaults, options);
    var centre = opts.radius / 2;

    var change = function(thus) {
      var elem = document.createElement('canvas');
      elem.setAttribute('width', opts.radius);
      elem.setAttribute('height', opts.radius);

      thus.wrapInner("<span />").append(elem);

      var span = $("span", thus).hide();
      var values = span.text().split(opts.delimeter);
      var v1 = parseInt(values[0]);
      var v2 = parseInt(values[1]);
      var adjust = -Math.PI / 2;
      var slice = (v1 / v2) * Math.PI * 2;
      var canvas = elem.getContext("2d");

      // Plate.
      canvas.beginPath();
      canvas.moveTo(centre, centre);
      canvas.arc(centre, centre, centre, 0, Math.PI * 2, false);
      canvas.closePath();
      canvas.fillStyle = opts.colours[0];
      canvas.fill();

      // Slice of pie.
      canvas.beginPath();
      canvas.moveTo(centre, centre);
      canvas.arc(centre, centre, centre, adjust, slice + adjust, false);
      canvas.closePath();
      canvas.fillStyle = opts.colours[1];
      canvas.fill();

      thus.trigger("chart:changed", [v1, v2]);
    };

    $(this).each(function() {
      $(this).change(function() {
        change($(this));
      }).trigger("change");
    });

    return this;
  };

  $.fn.peity.defaults = {
    colours: ['#FFF4DD', '#FF9900'],
    delimeter: '/',
    radius: 16
  };
})(jQuery);
