// Peity jQuery plugin version 1.2.1
// (c) 2013 Ben Pickles
//
// http://benpickles.github.io/peity
//
// Released under MIT license.
(function($, document, Math, devicePixelRatio) {
  var canvasSupported = document.createElement("canvas").getContext

  var peity = $.fn.peity = function(type, options) {
    if (canvasSupported) {
      this.each(function() {
        var $this = $(this)
        var chart = $this.data("peity")

        if (chart) {
          if (type) chart.type = type
          $.extend(chart.opts, options)
          chart.draw()
        } else {
          var defaults = peity.defaults[type]
          var data = {}

          $.each($this.data(), function(name, value) {
            if (name in defaults) data[name] = value
          })

          var opts = $.extend({}, defaults, data, options)
          var chart = new Peity($this, type, opts)
          chart.draw()

          $this
            .change(function() { chart.draw() })
            .data("peity", chart)
        }
      });
    }

    return this;
  };

  var Peity = function($el, type, opts) {
    this.$el = $el
    this.type = type
    this.opts = opts
  }

  var PeityPrototype = Peity.prototype

  PeityPrototype.colours = function() {
    var colours = this.opts.colours
    var func = colours

    if (!$.isFunction(func)) {
      func = function(_, i) {
        return colours[i % colours.length]
      }
    }

    return func
  }

  PeityPrototype.draw = function() {
    peity.graphers[this.type].call(this, this.opts)
  }

  PeityPrototype.prepareCanvas = function(width, height) {
    if (this.svg) {
      $(this.svg).empty()
    } else {
      this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
      this.svg.setAttribute("class", "peity")

      this.$el.hide().after(this.svg)

      $(this.svg).data("peity", this)
    }

    this.svg.setAttribute("height", height)
    this.svg.setAttribute("width", width)
  }

  PeityPrototype.values = function() {
    return $.map(this.$el.text().split(this.opts.delimiter), function(value) {
      return parseFloat(value)
    })
  }

  peity.defaults = {}
  peity.graphers = {}

  peity.register = function(type, defaults, grapher) {
    this.defaults[type] = defaults
    this.graphers[type] = grapher
  }

  peity.register(
    'pie',
    {
      colours: ["#ff9900", "#fff4dd", "#ffc66e"],
      delimiter: null,
      diameter: 16
    },
    function(opts) {
      if (!opts.delimiter) {
        var delimiter = this.$el.text().match(/[^0-9\.]/)
        opts.delimiter = delimiter ? delimiter[0] : ","
      }

      var values = this.values()

      if (opts.delimiter == "/") {
        var v1 = values[0]
        var v2 = values[1]
        values = [v1, v2 - v1]
      }

      var i = 0
      var length = values.length
      var sum = 0

      for (; i < length; i++) {
        sum += values[i]
      }

      var width = opts.width || opts.diameter
        , height = opts.height || opts.diameter

      this.prepareCanvas(width, height)

      var radius = Math.min(width, height) / 2
      var pi = Math.PI
      var colours = this.colours()
      var start = -pi / 2

      for (i = 0; i < length; i++) {
        var value = values[i]
          , portion = value / sum
          , node

        if (portion == 1) {
          node = document.createElementNS("http://www.w3.org/2000/svg", "circle")
          node.setAttribute("cx", radius)
          node.setAttribute("cy", radius)
          node.setAttribute("r", radius)
        } else {
          var slice = portion * pi * 2
            , end = start + slice
            , x1 = radius * Math.cos(start) + radius
            , y1 = radius * Math.sin(start) + radius
            , x2 = radius * Math.cos(end) + radius
            , y2 = radius * Math.sin(end) + radius

          var d = [
            "M", radius, radius,
            "L", x1, y1,
            "A", radius, radius, 0, slice > pi ? 1 : 0, 1, x2, y2,
            "Z"
          ]

          node = document.createElementNS("http://www.w3.org/2000/svg", "path")
          node.setAttribute("d", d.join(" "))

          start = end
        }

        node.setAttribute("fill", colours.call(this, value, i, values))

        this.svg.appendChild(node)
      }
    }
  )

  peity.register(
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

      var width = opts.width
        , height = opts.height

      this.prepareCanvas(width, height)

      height -= opts.strokeWidth

      var xQuotient = width / (values.length - 1)
        , yQuotient = height / (max - min)
        , zero = height + (min * yQuotient)
        , coords = [0, zero]

      for (var i = 0; i < values.length; i++) {
        var x = i * xQuotient
        var y = height - (yQuotient * (values[i] - min)) + opts.strokeWidth / 2

        coords.push(x, y)
      }

      coords.push(width, zero)

      var polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon")
      polygon.setAttribute("fill", opts.colour)
      polygon.setAttribute("points", coords.join(" "))

      this.svg.appendChild(polygon)

      if (opts.strokeWidth) {
        var polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline")
        polyline.setAttribute("fill", "transparent")
        polyline.setAttribute("points", coords.slice(2, coords.length - 2).join(" "))
        polyline.setAttribute("stroke", opts.strokeColour)
        polyline.setAttribute("stroke-width", opts.strokeWidth)
        polyline.setAttribute("stroke-linecap", "square")

        this.svg.appendChild(polyline)
      }
    }
  );

  peity.register(
    'bar',
    {
      colours: ["#4D89F9"],
      delimiter: ",",
      height: 16,
      max: null,
      min: 0,
      spacing: devicePixelRatio,
      width: 32
    },
    function(opts) {
      var values = this.values()
      var max = Math.max.apply(Math, values.concat([opts.max]));
      var min = Math.min.apply(Math, values.concat([opts.min]))

      var width = opts.width
        , height = opts.height

      this.prepareCanvas(width, height)

      var yQuotient = height / (max - min)
      var space = opts.spacing
      var xQuotient = (width + space) / values.length
      var colours = this.colours()

      for (var i = 0; i < values.length; i++) {
        var value = values[i]
        var y = height - (yQuotient * (value - min))
        var h

        if (value == 0) {
          if (min >= 0 || max > 0) y -= 1
          h = 1
        } else {
          h = yQuotient * value
        }

        if (h < 0) {
          y += h
          h = -h
        }

        var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
        rect.setAttribute("fill", colours.call(this, value, i, values))
        rect.setAttribute("x", i * xQuotient)
        rect.setAttribute("y", y)
        rect.setAttribute("width", xQuotient - space)
        rect.setAttribute("height", h)

        this.svg.appendChild(rect)
      }
    }
  );
})(jQuery, document, Math, window.devicePixelRatio || 1);
