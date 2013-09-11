  // Peity jQuery plugin version 1.2.0
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
            if(type) chart.type = type
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
            .change(function(a,b,c) { chart.draw(); })
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
    
    var PeityPrototype = Peity.prototype;
    
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
      var canvas = this.canvas
      var $canvas
      
      if (canvas) {
        this.context.clearRect(0, 0, canvas.width, canvas.height)
        $canvas = $(canvas)
      } else {
        $canvas = $("<canvas>").css({
          height: height,
          width: width
        }).addClass("peity").data("peity", this)
        
        this.canvas = canvas = $canvas[0]
        this.context = canvas.getContext("2d")
        this.$el.hide().after(canvas)
      }
      
      canvas.height = $canvas.height() * devicePixelRatio
      canvas.width = $canvas.width() * devicePixelRatio
      
      return canvas
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
        
        var canvas = this.prepareCanvas(opts.width || opts.diameter, opts.height || opts.diameter)
        var context = this.context
        var width = canvas.width
        var height = canvas.height
        var radius = Math.min(width, height) / 2
        var pi = Math.PI
        var colours = this.colours()
        
        context.save()
        context.translate(width / 2, height / 2)
        context.rotate(-pi / 2)
        
        for (i = 0; i < length; i++) {
          var value = values[i]
          var slice = (value / sum) * pi * 2
          
          context.beginPath()
          context.moveTo(0, 0)
          context.arc(0, 0, radius, 0, slice, false)
          context.fillStyle = colours.call(this, value, i, values)
          context.fill()
          context.rotate(slice)
        }
        
        context.restore()
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
    
    peity.register(
      'bar',
      {
        baselineColour : "#000000",
        fontColour : "#000000",
        fontStyle : "12pt Arial, sans-serif",
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
        
        var element = this.$el;
        var canvas = this.prepareCanvas(opts.width, opts.height)
        var context = this.context
        
        var width = canvas.width - 6
        var height = canvas.height - 7
        var yQuotient = height / (max - min)
        var space = opts.spacing
        var xQuotient = (width + space) / values.length
        var colours = this.colours()
        var baseline = yQuotient * max + 3
        
        for (var i = 0; i < values.length; i++) {
          var value = values[i]
          var y = 3 + height - (yQuotient * (value - min));
          var h
          
          if (value == 0) {
            if (min >= 0 || max > 0) y -= 1
            h = 1
          } else {
            h = yQuotient * values[i]
          }
          
          var x = 3 + i * xQuotient;
          var w = xQuotient - space
          
          context.fillStyle = colours.call(this, value, i, values)
          context.fillRect(x, y, w, h)
        }
        
        //Draw baseline
        context.fillStyle = opts.baselineColour
        context.fillRect(0, yQuotient * max+3,canvas.width, 3)
        
        var mousePos = element.data("position");
        console.log(mousePos);
        if(mousePos){
          mousePos = JSON.parse(mousePos);
          for (var i = 0; i < values.length; i++) {
            var value = values[i]
            var y = 3 + height - (yQuotient * (value - min));
            var h
            
            if (value == 0) {
              if (min >= 0 || max > 0) y -= 1
              h = 1
            } else {
              h = yQuotient * values[i]
            }
            
            var x = 3 + i * xQuotient;
            var w = xQuotient - space;
            
            //Draw outline around hovered rectangle and write value
            
            if(mousePos.x >= x && mousePos.x <= x+w){
              var newY = h < 0 ? y + h : y;
              var newH = h < 0 ? -h : h;
              if(mousePos.y >= newY && mousePos.y <= newY+newH){
                context.strokeRect(x-1,y > baseline ? y + 1: y-1, w+2,y > baseline ? h+1 : h+2)
                context.fillStyle = opts.fontColour;
                context.font = opts.fontStyle;
                if(x > canvas.width / 2) context.textAlign = "right";
                context.fillText(value,x,baseline - 4)
              }
            }
          }
        }
        
        canvas.addEventListener('mousemove', function(evt) {
          this.removeEventListener('mousemove',arguments.callee,false);
          var rect = canvas.getBoundingClientRect();
          var pos = { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
          element.data("position",JSON.stringify(pos)).change();
        }, false);
      }
    );
  })(jQuery, document, Math, window.devicePixelRatio || 1);
