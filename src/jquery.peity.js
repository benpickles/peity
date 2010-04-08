// Convert something like "<span>8/10</span>" into a small, inline pie chart.
(function($) {
  $.fn.peity = function(options) {
    var opts = $.extend({}, $.fn.peity.defaults, options);
    var centre = opts.radius / 2;
    
    var change = function(){
      // Remove if previous chart before regenerating
      $(this).siblings('canvas.peity_chart_canvas').remove();
      var elem = document.createElement('canvas');
      elem.setAttribute('width', opts.radius);
      elem.setAttribute('height', opts.radius);
      elem.setAttribute('class', 'peity_chart_canvas');
      var span = $(this);
      span.before(elem);
      span.hide();

      var values = span.text().split(opts.delimeter);
      var v1 = parseInt(values[0]);
      var v2 = parseInt(values[1]);
      var adjust = -Math.PI / 2;
      var slice = (v1 / v2) * Math.PI * 2;
      var canvas = elem.getContext("2d");

      // Background.
      canvas.beginPath();
      canvas.moveTo(centre, centre);
      canvas.arc(centre, centre, centre, 0, Math.PI * 2, false);
      canvas.closePath();
      canvas.fillStyle = opts.colours[0];
      canvas.fill();

      // Slice.
      canvas.beginPath();
      canvas.moveTo(centre, centre);
      canvas.arc(centre, centre, centre, adjust, slice + adjust, false);
      canvas.closePath();
      canvas.fillStyle = opts.colours[1];
      canvas.fill();
      $(this).trigger('chart:changed', [v1, v2]);
    };
    $(this).bind('change', change);
    $(this).trigger('change');
    return this;
  };

  $.fn.peity.defaults = {
    colours: ['#FFF4DD', '#FF9900'],
    delimeter: '/',
    radius: 16
  };
})(jQuery);
