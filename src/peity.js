// Convert something like "<span>8/10</span>" into a small, inline pie chart.
(function($) {
  $.fn.peity = function(options) {
    var opts = $.extend({}, $.fn.peity.defaults, options);
    var centre = opts.radius / 2;

    this.each(function() {
      var elem = document.createElement('canvas');
      elem.setAttribute('width', opts.radius);
      elem.setAttribute('height', opts.radius);

      var span = $(this);
      span.before(elem);
      span.hide();

      var values = span.text().split('/');
      var v1 = parseInt(values[0]);
      var v2 = parseInt(values[1]);
      var adjust = -Math.PI / 2;
      var slice = (v1 / v2) * Math.PI * 2;
      var canvas = elem.getContext("2d");

      // Background.
      canvas.beginPath();
      canvas.moveTo(centre, centre);
      canvas.arc(centre, centre, centre, 0, Math.PI * 2);
      canvas.closePath();
      canvas.fillStyle = opts.colours[0];
      canvas.fill();

      // Slice.
      canvas.beginPath();
      canvas.moveTo(centre, centre);
      canvas.arc(centre, centre, centre, adjust, slice + adjust);
      canvas.closePath();
      canvas.fillStyle = opts.colours[1];
      canvas.fill();
    });

    return this;
  };

  $.fn.peity.defaults = {
    colours: ['FFF4DD', 'FF9900'],
    radius: 16
  };
})(jQuery);
