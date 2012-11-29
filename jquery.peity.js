// Peity jQuery plugin version 0.6.1
// (c) 2012 Ben Pickles
//
// http://benpickles.github.com/peity
//
// Released under MIT license.
(function($, document) {
  var canvasSupported = document.createElement("canvas").getContext
  var devicePixelRatio = window.devicePixelRatio || 1

  var peity = $.fn.peity = function(type, options) {
    if (canvasSupported) {
      this.each(function() {
        var defaults = Peity.defaults[type]
        var opts = $.extend({}, defaults, options)
        var $this = $(this)

        $.each($this.data(), function(name, value) {
          if (name in defaults) opts[name] = value
        })

        var chart = new Peity($this, type, opts)
        chart.draw()

        $this.change(function() {
          chart.draw()
        })
      });
    }

    return this;
  };

  function createCanvas(width, height) {
    var canvas = document.createElement("canvas")
    canvas.setAttribute("width", width * devicePixelRatio)
    canvas.setAttribute("height", height * devicePixelRatio)

    if (devicePixelRatio != 1) {
      var style = "width:" + width + "px;height:" + height + "px"
      canvas.setAttribute("style", style)
    }

    return canvas
  }
  peity.createCanvas = createCanvas;

  var Peity = function($elem, type, opts) {
    this.$elem = $elem
    this.type = type
    this.opts = opts
  }

  Peity.prototype.draw = function() {
    Peity.graphers[this.type].call(this, this.opts)
  }

  Peity.prototype.prepareCanvas = function(width, height) {
    var canvas = this.canvas

    if (canvas) {
      this.context.clearRect(0, 0, canvas.width, canvas.height)
    } else {
      this.canvas = canvas = createCanvas(width, height)
      this.$elem.hide().before(canvas)
      this.context = canvas.getContext("2d")
    }

    return canvas
  }

  Peity.prototype.values = function() {
    return this.$elem.text().split(this.opts.delimiter)
  }

  Peity.graphers = {}
  Peity.defaults = {}

  Peity.register = function(type, defaults, grapher) {
    this.defaults[type] = defaults
    this.graphers[type] = grapher
  }

  Peity.register(
    'pie',
    {
      colours: ['#FFF4DD', '#FF9900'],
      delimiter: '/',
      diameter: 16
    },
    function(opts) {
      var values = this.values()
      var v1 = parseFloat(values[0]);
      var v2 = parseFloat(values[1]);
      var slice = (v1 / v2) * Math.PI * 2;

      var canvas = this.prepareCanvas(opts.diameter, opts.diameter)
      var context = this.context
      var half = canvas.width / 2

      context.translate(half, half)
      context.rotate(-Math.PI / 2)

      // Plate.
      context.beginPath();
      context.moveTo(0, 0)
      context.arc(0, 0, half, 0, slice == 0 ? Math.PI * 2 : slice, true)
      context.fillStyle = opts.colours[0];
      context.fill();

      // Slice of pie.
      context.beginPath();
      context.moveTo(0, 0)
      context.arc(0, 0, half, 0, slice, false)
      context.fillStyle = opts.colours[1];
      context.fill();
  });

  Peity.register(
    "line",
    {
      colour: "#c6d9fd",
      strokeColour: "#4d89f9",
      strokeWidth: 1,
      delimiter: ",",
      height: 16,
      max: null,
      min: 0,
      width: 32
    },
    function(opts) {
      var values = this.values()
      if (values.length == 1) values.push(values[0])
      var max = Math.max.apply(Math, values.concat([opts.max]));
      var min = Math.min.apply(Math, values.concat([opts.min]))

      var canvas = this.prepareCanvas(opts.width, opts.height)
      var context = this.context
      var width = canvas.width
      var height = canvas.height
      var xQuotient = width / (values.length - 1)
      var yQuotient = height / (max - min)

      var coords = [];
      var i;

      context.beginPath();
      context.moveTo(0, height + (min * yQuotient))

      for (i = 0; i < values.length; i++) {
        var x = i * xQuotient
        var y = height - (yQuotient * (values[i] - min))

        coords.push({ x: x, y: y });
        context.lineTo(x, y);
      }

      context.lineTo(width, height + (min * yQuotient))
      context.fillStyle = opts.colour;
      context.fill();

      if (opts.strokeWidth) {
        context.beginPath();
        context.moveTo(0, coords[0].y);
        for (i = 0; i < coords.length; i++) {
          context.lineTo(coords[i].x, coords[i].y);
        }
        context.lineWidth = opts.strokeWidth * devicePixelRatio;
        context.strokeStyle = opts.strokeColour;
        context.stroke();
      }
    }
  );

  Peity.register(
    'bar',
    {
      colour: "#4D89F9",
      delimiter: ",",
      height: 16,
      max: null,
      min: 0,
      width: 32
    },
    function(opts) {
      var values = this.values()
      var max = Math.max.apply(Math, values.concat([opts.max]));
      var min = Math.min.apply(Math, values.concat([opts.min]))

      var canvas = this.prepareCanvas(opts.width, opts.height)
      var context = this.context

      var width = canvas.width
      var height = canvas.height
      var yQuotient = height / (max - min)
      var space = devicePixelRatio / 2
      var xQuotient = (width + space) / values.length

      context.fillStyle = opts.colour;

      for (var i = 0; i < values.length; i++) {
        var x = i * xQuotient
        var y = height - (yQuotient * (values[i] - min))

        context.fillRect(x, y, xQuotient - space, yQuotient * values[i])
      }
    }
  );
})(jQuery, document);
