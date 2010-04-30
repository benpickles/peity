// Peity jQuery plugin
// (c) 2010 Ben Pickles
//
// http://benpickles.github.com/peity/
//
// Released under MIT license.
(function($) {
  $.fn.peity = function(type, options) {    

    $(this).each(function() {
      $(this).change(function() {
        var value = $(this).html();
        $.fn.peity.graphers[type]($(this), $.extend({}, $.fn.peity.defaults[type], options));
        $(this).trigger("chart:changed", value);
      }).trigger("change");
    });

    return this;
  };
  
  $.fn.peity.graphers = {};
  $.fn.peity.defaults = {};
  
  $.fn.peity.add = function(type, defaults, grapher){
    $.fn.peity.graphers[type] = grapher;
    $.fn.peity.defaults[type] = defaults;
  };
  
  $.fn.peity.add(
    'pie', 
    {
      colours: ['#FFF4DD', '#FF9900'],
      delimeter: '/',
      radius: 16
    },
    function(thus, opts){
      var centre = opts.radius / 2;
      var elem = document.createElement('canvas');
      elem.setAttribute('width', opts.radius);
      elem.setAttribute('height', opts.radius);
      
      thus.wrapInner("<span />").append(elem);
      
      var span = $("span", thus).hide();
      var values = span.text().split(opts.delimeter);
      var v1 = parseFloat(values[0]);
      var v2 = parseFloat(values[1]);
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
      
  });
  
  $.fn.peity.add(
    'bar',
    {
      colour: "#4D89F9",
      delimeter: ",",
      height: 16,
      width: 32
    },
    function(thus, opts) {
    
      var elem = document.createElement('canvas');
      elem.setAttribute('width', opts.width);
      elem.setAttribute('height', opts.height);
    
      thus.wrapInner("<span />").append(elem);
    
      var span = $("span", thus).hide();
      var values = span.text().split(opts.delimeter);
      var ratio = opts.height / Math.max.apply(Math, values);
      var width = opts.width / values.length;
    
      var canvas = elem.getContext("2d");
      canvas.fillStyle = opts.colour;
    
      for (var i = 0; i < values.length; i++) {
        var height = ratio * values[i];
        var x = i * width;
        var y = opts.height - height;
    
        canvas.fillRect(x, y, width, height);
      }    
    }
  );

})(jQuery);