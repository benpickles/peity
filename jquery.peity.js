// Peity jQuery plugin version 2.0.5
// (c) 2014 Ben Pickles
//
// http://benpickles.github.io/peity
//
// Released under MIT license.
(function($, document, Math) {
  var svgElement = function(tag, attrs) {
    var elem = document.createElementNS("http://www.w3.org/2000/svg", tag)
    $(elem).attr(attrs)
    return elem
  }

  // https://gist.github.com/madrobby/3201472
  var svgSupported = 'createElementNS' in document && svgElement('svg').createSVGRect

  var peity = $.fn.peity = function(type, options) {
    if (svgSupported) {
      this.each(function() {
        var $this = $(this)
        var chart = $this.data("peity")

        if (chart) {
          if (type) chart.type = type
          $.extend(chart.opts, options)
        } else {
          var defaults = peity.defaults[type]
          var data = {}

          $.each($this.data(), function(name, value) {
            if (name in defaults) data[name] = value
          })

          chart = new Peity(
            $this,
            type,
            $.extend({}, defaults, data, options)
          )

          $this
            .change(function() { chart.draw() })
            .data("peity", chart)
        }

        chart.draw()
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

  PeityPrototype.draw = function() {
    peity.graphers[this.type].call(this, this.opts)
  }

  PeityPrototype.fill = function() {
    var fill = this.opts.fill

    return $.isFunction(fill)
      ? fill
      : function(_, i) { return fill[i % fill.length] }
  }

  PeityPrototype.prepare = function(width, height) {
    if (!this.svg) {
      this.$el.hide().after(
        this.svg = svgElement("svg", {
          "class": "peity"
        })
      )
    }

    return $(this.svg)
      .empty()
      .data('peity', this)
      .attr({
        height: height,
        width: width
      })
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
      delimiter: null,
      diameter: 16,
      fill: ["#ff9900", "#fff4dd", "#ffc66e"]
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
        values = [v1, Math.max(0, v2 - v1)]
      }

      var i = 0
      var length = values.length
      var sum = 0

      for (; i < length; i++) {
        sum += values[i]
      }

      var $svg = this.prepare(
        opts.width || opts.diameter,
        opts.height || opts.diameter
      )

      var width = $svg.width()
        , height = $svg.height()
        , cx = width / 2
        , cy = height / 2

      var radius = Math.min(cx, cy)
      var pi = Math.PI
      var fill = this.fill()

      var scale = this.scale = function(value, radius) {
        var radians = value / sum * pi * 2 - pi / 2

        return [
          radius * Math.cos(radians) + cx,
          radius * Math.sin(radians) + cy
        ]
      }

      var cumulative = 0

      for (i = 0; i < length; i++) {
        var value = values[i]
          , portion = value / sum
          , node

        if (portion == 0) continue

        if (portion == 1) {
          node = svgElement("circle", {
            cx: cx,
            cy: cy,
            r: radius
          })
        } else {
          var d = ['M', cx, cy, 'L']
            .concat(
              scale(cumulative, radius),
              ['A', radius, radius, 0, portion > 0.5 ? 1 : 0, 1],
              scale(cumulative += value, radius),
              ['Z']
            )

          node = svgElement("path", {
            d: d.join(" ")
          })
        }

        $(node).attr('fill', fill.call(this, value, i, values))

        this.svg.appendChild(node)
      }
    }
  )

  peity.register(
    "line",
    {
      delimiter: ",",
      fill: "#c6d9fd",
      height: 16,
      max: null,
      min: 0,
      stroke: "#4d89f9",
      strokeWidth: 1,
      width: 32
    },
    function(opts) {
      var values = this.values()
      if (values.length == 1) values.push(values[0])
      var max = Math.max.apply(Math, typeof opts.max == 'number' ? values.concat([opts.max]) : values)
      var min = Math.min.apply(Math, typeof opts.min == 'number' ? values.concat([opts.min]) : values)

      var $svg = this.prepare(opts.width, opts.height)
        , width = $svg.width()
        , height = $svg.height() - opts.strokeWidth
        , diff = max - min

      var xScale = this.x = function(input) {
        return input * (width / (values.length - 1))
      }

      var yScale = this.y = function(input) {
        var y = height

        if (diff != 0) {
          y -= ((input - min) / diff) * height
        }

        return y + opts.strokeWidth / 2
      }

      var zero = yScale(Math.max(min, 0))
        , coords = [0, zero]

      for (var i = 0; i < values.length; i++) {
        coords.push(
          xScale(i),
          yScale(values[i])
        )
      }

      coords.push(width, zero)

      this.svg.appendChild(
        svgElement('polygon', {
          fill: opts.fill,
          points: coords.join(' ')
        })
      )

      if (opts.strokeWidth) {
        this.svg.appendChild(
          svgElement('polyline', {
            fill: 'transparent',
            points: coords.slice(2, coords.length - 2).join(' '),
            stroke: opts.stroke,
            'stroke-width': opts.strokeWidth,
            'stroke-linecap': 'square'
          })
        )
      }
    }
  );

  peity.register(
    'bar',
    {
      delimiter: ",",
      fill: ["#4D89F9"],
      height: 16,
      max: null,
      min: 0,
      padding: 0.1,
      width: 32
    },
    function(opts) {
      var values = this.values()
      var max = Math.max.apply(Math, typeof opts.max == 'number' ? values.concat([opts.max]) : values)
      var min = Math.min.apply(Math, typeof opts.min == 'number' ? values.concat([opts.min]) : values)

      var $svg = this.prepare(opts.width, opts.height)
        , width = $svg.width()
        , height = $svg.height()
        , diff = max - min
        , padding = opts.padding
        , fill = this.fill()

      var xScale = this.x = function(input) {
        return input * width / values.length
      }

      var yScale = this.y = function(input) {
        return height - (
          diff == 0
            ? 1
            : ((input - min) / diff) * height
        )
      }

      for (var i = 0; i < values.length; i++) {
        var x = xScale(i + padding)
          , w = xScale(i + 1 - padding) - x
          , value = values[i]
          , valueY = yScale(value)
          , y1 = valueY
          , y2 = valueY
          , h

        if (diff == 0) {
          h = 1
        } else if (value < 0) {
          y1 = yScale(Math.min(max, 0))
        } else {
          y2 = yScale(Math.max(min, 0))
        }

        h = y2 - y1

        if (h == 0) {
          h = 1
          if (max > 0) y1--
        }

        this.svg.appendChild(
          svgElement('rect', {
            fill: fill.call(this, value, i, values),
            x: x,
            y: y1,
            width: w,
            height: h
          })
        )
      }
    }
  );
})(jQuery, document, Math);
