// Peity jQuery plugin version 0.6.1
// (c) 2011 Ben Pickles
//
// http://benpickles.github.com/peity/
//
// Released under MIT license.
(function($, document) {
  var peity = $.fn.peity = function(type, options) {
    if (document.createElement("canvas").getContext) {
      this.each(function() {
        $(this).change(function() {
          var opts = $.extend({}, options),
              self = this;

          $.each(opts, function(name, value) {
            if ($.isFunction(value))
              opts[name] = value.call(self);
          });

          var value = $(this).html();
          peity.graphers[type].call(this, $.extend({}, peity.defaults[type], opts));
          $(this).trigger("chart:changed", value);
        }).trigger("change");
      });
    }

    return this;
  };

  peity.graphers = {};
  peity.defaults = {};

  peity.add = function(type, defaults, grapher) {
    peity.graphers[type] = grapher;
    peity.defaults[type] = defaults;
  };

  var devicePixelRatio = window.devicePixelRatio || 1;

  function createCanvas(width, height) {
    var canvas = document.createElement("canvas");
    canvas.setAttribute("width", width * devicePixelRatio);
    canvas.setAttribute("height", height * devicePixelRatio);

    if (devicePixelRatio != 1) {
      var style = "width:" + width + "px;height:" + height + "px;";
      canvas.setAttribute("style", style);
    }

    return canvas;
  };

  peity.add(
    'pie',
    {
      colours   : ['#FFF4DD', '#FF9900'],
      delimeter : '/',
      diameter  : 16
    },
    function(opts) {
      var $this   = $(this),
          values  = $this.text().split(opts.delimeter),
          v1      = parseFloat(values[0]),
          v2      = parseFloat(values[1]),
          adjust  = -Math.PI / 2,
          slice   = (v1 / v2) * Math.PI * 2,
          canvas  = createCanvas(opts.diameter, opts.diameter),
          context = canvas.getContext("2d"),
          centre  = canvas.width / 2;

      // Plate.
      context.beginPath();
      context.moveTo(centre, centre);
      context.arc(centre, centre, centre, slice + adjust, (slice == 0) ? Math.PI * 2 : adjust, false);
      context.fillStyle = opts.colours[0];
      context.fill();

      // Slice of pie.
      context.beginPath();
      context.moveTo(centre, centre);
      context.arc(centre, centre, centre, adjust, slice + adjust, false);
      context.fillStyle = opts.colours[1];
      context.fill();

      $this.wrapInner($("<span>").hide()).append(canvas);
  });

  peity.add(
    "line",
    {
      colour        : "#c6d9fd",
      strokeColour  : "#4d89f9",
      strokeWidth   : 1,
      delimeter     : ",",
      height        : 16,
      max           : null,
      min           : 0,
      width         : 32
    },
    function(opts) {
      var $this     = $(this),
          canvas    = createCanvas(opts.width, opts.height),
          values    = $this.text().split(opts.delimeter);
      if (values.length == 1)
        values.push(values[0]);
      var max       = Math.max.apply(Math, values.concat([opts.max])),
          min       = Math.min.apply(Math, values.concat([opts.min])),
          context   = canvas.getContext("2d"),
          width     = canvas.width,
          height    = canvas.height,
          xQuotient = width / (values.length - 1),
          yQuotient = height / (max - min),
          coords    = [],
          i, l, x, y;

      context.beginPath();
      context.moveTo(0, height + (min * yQuotient));

      for (i = 0, l = values.length; i < l; i++) {
        x = i * xQuotient;
        y = height - (yQuotient * (values[i] - min));

        coords.push({ x: x, y: y });
        context.lineTo(x, y);
      }

      context.lineTo(width, height + (min * yQuotient));
      context.fillStyle = opts.colour;
      context.fill();

      if (opts.strokeWidth) {
        context.beginPath();
        context.moveTo(0, coords[0].y);
        for (i = 0, l = coords.length; i < l; i++) {
          context.lineTo(coords[i].x, coords[i].y);
        }
        context.lineWidth = opts.strokeWidth * devicePixelRatio;
        context.strokeStyle = opts.strokeColour;
        context.stroke();
      }

      $this.wrapInner($("<span>").hide()).append(canvas);
    }
  );

  peity.add(
    'bar',
    {
      colour    : "#4D89F9",
      delimeter : ",",
      height    : 16,
      max       : null,
      min       : 0,
      width     : 32
    },
    function(opts) {
      var $this     = $(this),
          values    = $this.text().split(opts.delimeter),
          max       = Math.max.apply(Math, values.concat([opts.max])),
          min       = Math.min.apply(Math, values.concat([opts.min])),
          canvas    = createCanvas(opts.width, opts.height),
          context   = canvas.getContext("2d"),
          width     = canvas.width,
          height    = canvas.height,
          yQuotient = height / (max - min),
          space     = devicePixelRatio / 2,
          xQuotient = (width + space) / values.length,
          i, l, x, y;

      context.fillStyle = opts.colour;

      for (i = 0, l = values.length; i < l; i++) {
        x = i * xQuotient;
        y = height - (yQuotient * (values[i] - min));

        context.fillRect(x, y, xQuotient - space, yQuotient * values[i]);
      }

      $this.wrapInner($("<span>").hide()).append(canvas);
    }
  );
})(jQuery, document);