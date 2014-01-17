// Peity jQuery plugin version 1.2.1
// (c) 2013 Ben Pickles
//
// http://benpickles.github.io/peity
//
// Released under MIT license.
(function($, Math) {
	var canvasSupported = document.createElement("canvas").getContext;
	var peity = $.fn.peity = function(type, options) {
		if (canvasSupported) {
			this.each(function() {
				var $this = $(this);
				var chart = $this.data("peity");
				
				if (chart) {
					if(type) chart.type = type;
					$.extend(chart.opt, options);
					chart.draw();
				} else {
					var defaults = peity.defaults[type];
					var data = {};
					$.each($this.data(), function(name, value) { if(name in defaults) data[name] = value; });
					
					var opt = $.extend({}, defaults, data, options);
					chart = new Peity($this, type, opt);
					chart.draw();
					
					$this.change(function(a,b,c) { chart.draw(); }).data("peity", chart);
				}
			});
		}
		return this;
	};
	
	var Peity = function($el, type, opt) { this.$el = $el; this.type = type; this.opt = opt; };
	var PeityPrototype = Peity.prototype;
	
	PeityPrototype.fill = function() {
		var fill = this.opt.fill;
		if ($.isFunction(fill)) return fill;
		else return function(value, i) { return fill[i % fill.length]; };
	};
	
	PeityPrototype.draw = function() { peity.graphers[this.type].call(this, this.opt); };
	
	//Prepare a canvas element to draw on
	PeityPrototype.prepareCanvas = function(width, height) {
		var self = this;
		var canvas = self.canvas;
		var $canvas;
		
		//If pre-existing canvas, clear it, otherwise create it.
		if (canvas) {
			canvas.width = canvas.width;//Reset width to clear it instead of drawing blank rectangle. Fixes flicker in Firefox
		} else {
			$canvas = $("<canvas>").css({ height: height, width: width }).addClass("peity").data("peity", self);
			self.canvas = canvas = $canvas[0];
			self.context = canvas.getContext("2d");
			self.$el.hide().after(canvas);
			canvas.height = $canvas.height();
			canvas.width = $canvas.width();
		}
		return canvas;
	};
	
	//Redraw chart with hover effect based on mouse position
	PeityPrototype.hoverEvent = function(evt) {
		PeityPrototype.removeEvents(this);
		var rect = this.getBoundingClientRect();
		$(this).prev().data("mouse",JSON.stringify({
			x: evt.clientX - rect.left,
			y: evt.clientY - rect.top
		})).change();
	};
	
	//Redraw chart with no hover effect
	PeityPrototype.exitEvent = function(evt) {
		PeityPrototype.removeEvents(this);
		$(this).prev().removeData("mouse").change(); 
	};
	
	//Remove event listeners from pie and bar charts to avoid infinite redrawing of hover effects
	PeityPrototype.removeEvents = function(node) {
		node.removeEventListener("mouseout",node.exitEvent,false);
		node.removeEventListener("mousemove",node.hoverEvent,false);
	};
	
	//Add event listeners to pie and bar charts to redraw hover effects
	PeityPrototype.addEvents = function(node) {
		node.addEventListener("mousemove", PeityPrototype.hoverEvent, false);
		node.addEventListener("mouseout", PeityPrototype.exitEvent, false);
	};
	
	//Splits values string into array by delimiter and returns the numbers. Split into multiple series if necessary 
	PeityPrototype.values = function() {
		var delim = this.opt.delimiter;
		var series = this.opt.seriesDelimiter;
		var text = this.$el.text();
		var splitter = function(e){ return e.split(delim).map(function(value) { return parseFloat(value); }); };
		if(series) return text.split(series).map(splitter);
		else return splitter(text);
	};
	
	PeityPrototype.drawArc = function(context, r, start, end, color, width) {
		context.beginPath();
		context.arc(0, 0, r, start, end, true);//true = counterclockwise
		context.strokeStyle = color;
		context.lineWidth = width;
		context.stroke();
	};
	
	//Default options and drawing functions per type
	peity.defaults = {};
	peity.graphers = {};
	peity.register = function(type, defaults, grapher) { this.defaults[type] = defaults; this.graphers[type] = grapher; 

};
	
	//Pie chart
	peity.register("pie", {
			fill: ["#f90", "#ffd", "#fc6"],
			delimiter: null,
			diameter: 16,
			lineColor: "#000", lineWidth: 0,
			focusColor : "#000", focusWidth : 0
		},
		function(opt) {
			var self = this;
			if(!opt.delimiter){
				//Default to first non-digit and non-period character found, or comma
				var delimiter = self.$el.text().match(/[^0-9\.]/);
				opt.delimiter = delimiter ? delimiter[0] : ",";
			}
			
			var values = self.values();
			//If something like 3/5, then this makes 3 and 2
			if (opt.delimiter === "/") { values = [values[0], values[1] - values[0]]; }
			
			var i, sum = 0, length = values.length;
			for (i = 0; i < length; i++) { sum += values[i]; }
			
			//Try width and height, but default to diameter (add 1 for a slight offset from edge)
			var element = self.$el;
			var hoverPos = element.data("mouse");
			var focusWidth = opt.focusWidth;
			var lineWidth = opt.lineWidth;
			var padding = Math.max(focusWidth, lineWidth)+1;
			var diameter = opt.diameter;
			var canvas = self.prepareCanvas(diameter+padding, diameter+padding);
			var context = self.context;
			var width = canvas.width;
			var height = canvas.height;
			var radius = width / 2 - padding;
			var pi = Math.PI;
			var tau = 2 * pi;
			var unit = tau / sum;
			var fill = self.fill();
			
			if(focusWidth && hoverPos){
					hoverPos = JSON.parse(hoverPos);
					//x and y are position from top left. r and a are radius and angle from center
					//Move origin from 0,0 to center of canvas
					hoverPos.x -= width / 2;
					hoverPos.y -= height / 2;
					hoverPos.y *= -1;
					//Find polar coordinates
					hoverPos.r = Math.sqrt(hoverPos.x * hoverPos.x + hoverPos.y * hoverPos.y);
					hoverPos.a = Math.atan2(hoverPos.y, hoverPos.x);
					while(hoverPos.a < 0) hoverPos.a += tau;
					while(hoverPos.a > tau) hoverPos.a -= tau;
			}
			
			//Save state and then move axes to be in center
			context.translate(width / 2, height / 2);
			
			var value, slice, start = 0;
			for (i = 0; i < length; i++) {
				value = values[i];
				slice = value * unit;//Size of slice
				context.beginPath();
				context.moveTo(0, 0);
				//Negatives in order to follow traditional polar grid system (to match cursor position)
				context.arc(0, 0, radius, -start, -(start + slice), true);
				context.fillStyle = fill.call(self, value, i, values);
				context.fill();
				
				//Draw focus around hovered rectangle
				if(focusWidth && hoverPos && hoverPos.a > start && hoverPos.a < (start + slice)){
					self.drawArc(context, radius + focusWidth / 2, -start, -(start+slice), opt.focusColor, focusWidth);
				}
				start += slice;
			}
			
			if(lineWidth){ self.drawArc(context, radius + lineWidth / 2, 0, tau, opt.lineColor, lineWidth); }
			if(focusWidth){ self.addEvents(canvas); }
		}
	);
	
	//Line Chart
	peity.register("line", {
			fill : "#cdf",
			lineColor : "#48f", lineWidth : 1,
			delimiter : ",",
			height : 16, width : 32,
			max : null, min: 0
		},
		function(opt) {
			var self = this;
			var values = self.values();
			if(values.length == 1) values.push(values[0]);
			var max = Math.max.apply(Math, values.concat([opt.max]));
			var min = Math.min.apply(Math, values.concat([opt.min]));
			var lineWidth = opt.lineWidth;
			
			var canvas = self.prepareCanvas(opt.width, opt.height);
			var context = self.context;
			var width = canvas.width;
			var height = canvas.height - lineWidth;
			
			var xQuotient = width / (values.length - 1);
			var yQuotient = height / (max - min);
			
			var coords = [];
			var i;
			
			context.beginPath();
			context.moveTo(0, height + (min * yQuotient));
			for (i = 0; i < values.length; i++) {
				var x = i * xQuotient;
				var y = height - (yQuotient * (values[i] - min)) + lineWidth / 2;
				
				coords.push({ x: x, y: y });
				context.lineTo(x, y);
			}
			context.lineTo(width, height + (min * yQuotient));
			
			if(opt.fill){
				context.fillStyle = opt.fill;
				context.fill();
			}
			
			//Draw line second to make sure it's on top of fill
			if (lineWidth) {
				context.beginPath();
				context.moveTo(0, coords[0].y);
				for (i = 0; i < coords.length; i++) {
					context.lineTo(coords[i].x, coords[i].y);
				}
				context.lineWidth = lineWidth;
				context.strokeStyle = opt.lineColor;
				context.stroke();
			}
		}
	);

	//Multi Line Chart
	peity.register("lines", {
			fill: ["#666666", "#803E75", "#FF6800"],
			lineColor: "#4d89f9",
			lineWidth: 1,
			delimiter: ",",
			seriesDelimiter : "|",
			height: 16,
			max: null,
			min: 0,
			width: 32
		},
		function(opt) {
			var self = this;
			var values = self.values();
			var allValues = [opt.max, opt.min].concat.apply([], values);
			var max = Math.max.apply(Math, allValues);
			var min = Math.min.apply(Math, allValues);
			var canvas = self.prepareCanvas(opt.width, opt.height);
			var context = self.context;
			var width = canvas.width;
			var height = canvas.height;
			var xQuotient = width / (values[1].length - 1);
			var yQuotient = height / (max - min);
			var fill = opt.fill;
			
			var i, j, series, coords;
			context.lineWidth = opt.lineWidth;
			
			//Create axisSize
			coords = [{x : 0, y: height - (yQuotient * (0 - min)) }, {x : width, y: height - (yQuotient * (0 - 

min)) }];
			context.beginPath();
			context.moveTo(0, coords[0].y);
			for (i = 0; i < coords.length; i++) context.lineTo(coords[i].x, coords[i].y);
			//Draw in specified color
			context.strokeStyle = fill[0 % fill.length];
			context.stroke();
			
			//Loop through each series then each value in the series
			for(j = 0; j < values.length; j += 1){
				series = values[j];
				coords = [];
				
				//Calculate coordinates for each value
				for (i = 0; i < series.length; i++) {
					coords.push({
						x: i * xQuotient,
						y: height - (yQuotient * (series[i] - min))
					});
				}
				
				//Create path between coordinates
				context.beginPath();
				context.moveTo(0, coords[0].y);
				for (i = 0; i < coords.length; i++) context.lineTo(coords[i].x, coords[i].y);
				//Draw in specified color
				context.strokeStyle = fill[(j+1) % fill.length];
				context.stroke();
			}
		}
	);

	//Bar chart
	peity.register("bar", {
			fill: ["#48f"],
			axisColor : "#000", axisSize : 1,
			fontColor : "#000", font : "12pt sans-serif",
			focusColor : "#000", focusWidth : 0,
			height: 16, width: 32,
			max: null, min: 0,
			delimiter: ",",
			gap: 1
		},
		function(opt) {
			//Declare variables
			var i, x, y, h, w, value, pixel;
			var self = this;
			
			//Find minimum and maximum in values to determine range
			var values = self.values();
			var max = Math.max.apply(Math, values.concat([opt.max]));
			var min = Math.min.apply(Math, values.concat([opt.min]));
			
			//Assign elements and options to variables
			var hoverPos = self.$el.data("mouse");
			var canvas = self.prepareCanvas(opt.width, opt.height);
			var context = self.context;
			
			var gap = opt.gap;
			var fill = self.fill();
			var focusWidth = opt.focusWidth;
			var axisSize = opt.axisSize;
			
			//Size
			var fullWidth = canvas.width;
			var fullHeight = canvas.height;
			var width = fullWidth - gap * 2;
			var height = fullHeight - gap * 2 - axisSize;
			var yQuotient = height / (max - min);//Height of bar of value 1
			var xQuotient = (width + gap) / values.length;//Width of bar
			var middle = yQuotient * max + gap;
			
			//Draw axisSize
			if(axisSize){
				context.fillStyle = opt.axisColor;
				context.fillRect(0, middle - (axisSize / 2),fullWidth, axisSize);
			}
			//Loop through values and draw each bar
			for (i = 0; i < values.length; i++) {
				value = values[i];
				
				//X position and width
				x = gap + i * xQuotient;
				w = xQuotient - gap;
				
				//Use value to determine height
				y = gap + height - (yQuotient * (value - min));
				h = yQuotient * value;
				
				//Draw the bar
				context.fillStyle = fill.call(self, value, i, values);
				context.fillRect(x, y, w, h);
			}
			//Draw focus around hovered rectangle and write value
			if(focusWidth && hoverPos){
				hoverPos = JSON.parse(hoverPos);
				//x and y are position from top left. r and a are radius and angle from center
				//Loop through values again
				for (i = 0; i < values.length; i++) {
					//Check if mouse is within this bar's horizontal space
					x = gap + i * xQuotient;
					w = xQuotient - gap;
					if(hoverPos.x >= x && hoverPos.x <= x+w){
						//Now check if mouse is within this bar's vertical space
						value = values[i];
						y = gap + height - (yQuotient * (value - min));
						h = value === 0 ? 1 : yQuotient * values[i];
						
						//To make comparison easier, make h positive and adjust y
						y = y + Math.min(h, 0);
						h = Math.abs(h);
						if(hoverPos.y >= y && hoverPos.y <= y+h){
							//If mouse is within a bar, draw a focus
							context.strokeStyle=opt.focusColor;
							context.lineWidth=focusWidth;
							context.strokeRect(
								x - focusWidth / 2,
								y - focusWidth / 2,
								w + focusWidth,
								h + focusWidth
							);
							context.fillStyle = opt.fontColor;
							context.font = opt.font;
							if(hoverPos.x > fullWidth / 2) context.textAlign = "right";
							if(hoverPos.y < fullHeight / 2) {
								context.textBaseline = "top";
								hoverPos.y += 20;
							}
							context.fillText(value + "",hoverPos.x,hoverPos.y);
						}
						break;//Don't analyze other values
					}
				}
			}
			
			if(focusWidth){ self.addEvents(canvas); }
		}
	);
})(jQuery, Math);