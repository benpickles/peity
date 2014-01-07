// Peity jQuery plugin version 1.2.0
// (c) 2013 Ben Pickles
//
// http://benpickles.github.io/peity
//
// Released under MIT license.
(function($, document, devicePixelRatio) {
	var canvasSupported = document.createElement("canvas").getContext;
	var peity = $.fn.peity = function(type, options) {
		if (canvasSupported) {
			this.each(function() {
				var $this = $(this);
				var chart = $this.data("peity");
				
				if (chart) {
					if(type) chart.type = type;
					$.extend(chart.opts, options);
					chart.draw();
				} else {
					var defaults = peity.defaults[type];
					var data = {};
					$.each($this.data(), function(name, value) { if(name in defaults) data[name] = value; });
					
					var opts = $.extend({}, defaults, data, options);
					chart = new Peity($this, type, opts);
					chart.draw();
					
					$this.change(function(a,b,c) { chart.draw(); }).data("peity", chart);
				}
			});
		}
		return this;
	};
	
	var Peity = function($el, type, opts) { this.$el = $el; this.type = type; this.opts = opts; };
	var PeityPrototype = Peity.prototype;
	
	PeityPrototype.colors = function() {
		var colors = this.opts.colors;
		if ($.isFunction(colors)) return colors;
		else return function(value, i) { return colors[i % colors.length]; };
	};
	
	PeityPrototype.draw = function() { peity.graphers[this.type].call(this, this.opts); };
	
	PeityPrototype.prepareCanvas = function(width, height) {
		var canvas = this.canvas;
		var $canvas;
		
		//If pre-existing canvas, clear it, otherwise create it.
		if (canvas) {
			this.context.clearRect(0, 0, canvas.width, canvas.height);
			$canvas = $(canvas);
		} else {
			$canvas = $("<canvas>").css({ height: height, width: width }).addClass("peity").data("peity", this);
			this.canvas = canvas = $canvas[0];
			this.context = canvas.getContext("2d");
			this.$el.hide().after(canvas);
		}
		
		canvas.height = $canvas.height() * devicePixelRatio;
		canvas.width = $canvas.width() * devicePixelRatio;
		
		return canvas;
	};
	
	PeityPrototype.hoverEvent = function(evt) {
		this.removeEventListener('mouseout',this.exitEvent,false);
		this.removeEventListener('mousemove',this.hoverEvent,false);
		var rect = this.getBoundingClientRect();
		var pos = { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
		$(this.previousSibling).data("position",JSON.stringify(pos)).change();
	};
	PeityPrototype.exitEvent = function(evt) {
		this.removeEventListener('mouseout',this.exitEvent,false);
		this.removeEventListener('mousemove',this.hoverEvent,false);
		$(this.previousSibling).removeData("position").change(); 
	};
	
	PeityPrototype.addEvents = function() {
		var canvas = this.canvas;
		canvas.addEventListener('mousemove', PeityPrototype.hoverEvent, false);
		canvas.addEventListener('mouseout', PeityPrototype.exitEvent, false);
		return this
	};
	
	//Splits values string into array by delimiter and returns the numbers. Split into multiple series if necessary (multiline graph)
	PeityPrototype.values = function() {
		var delim = this.opts.delimiter;
		if(this.opts.seriesDelimiter) return this.$el.text().split(this.opts.seriesDelimiter).map(function(e) { return e.split(delim).map(function(value) { return parseFloat(value); }); });
		else return this.$el.text().split(this.opts.delimiter).map(function(value) { return parseFloat(value); });
	};
	
	PeityPrototype.drawArc = function(context, r, start, end, option, color, width) {
		context.beginPath();
		context.arc(0, 0, r, start, end, option);
		context.strokeStyle = color;
		context.lineWidth = width;
		context.stroke();
	};
	
	//Default options and drawing functions per type
	peity.defaults = {};
	peity.graphers = {};
	peity.register = function(type, defaults, grapher) { this.defaults[type] = defaults; this.graphers[type] = grapher; };
	
	//Pie chart
	peity.register('pie', {
			colors: ["#f90", "#ffd", "#fc6"],
			delimiter: null,
			diameter: 16,
			lineColor: "#000", lineWidth: 0,
			focusColor : "#000", focusWidth : 0
		},
		function(opts) {
			if(!opts.delimiter){
				//Default to first non-digit and non-period character found, or comma
				var delimiter = this.$el.text().match(/[^0-9\.]/);
				opts.delimiter = delimiter ? delimiter[0] : ",";
			}
			
			var values = this.values();
			//If something like 3/5, then this makes 3 and 2
			if (opts.delimiter === "/") { values = [values[0], values[1] - values[0]]; }
			
			var i, sum = 0, length = values.length;
			for (i = 0; i < length; i++) { sum += values[i]; }
			
			//Try width and height, but default to diameter (add 1 for a slight offset from edge)
			var element = this.$el;
			var hoverPos = element.data("position");
			var focusWidth = opts.focusWidth;
			var lineWidth = opts.lineWidth;
			var padding = Math.max(focusWidth, lineWidth)+1;
			var diameter = opts.diameter;
			var canvas = this.prepareCanvas(diameter+padding, diameter+padding);
			var context = this.context;
			var width = canvas.width;
			var height = canvas.height;
			var radius = width / 2 - padding;
			var pi = Math.PI;
			var tau = 2 * pi;
			var unit = tau / sum;
			var colors = this.colors();
			
			if(focusWidth > 0 && hoverPos !== undefined){
					hoverPos = JSON.parse(hoverPos);
					//Move origin from 0,0 to center of canvas
					hoverPos.x -= width / 2;
					hoverPos.y -= height / 2;
					hoverPos.y *= -1;
					//Find polar coordinates
					hoverPos.r = Math.sqrt(hoverPos.x * hoverPos.x + hoverPos.y * hoverPos.y);
					hoverPos.theta = Math.atan2(hoverPos.y, hoverPos.x);
					while(hoverPos.theta < 0) hoverPos.theta += tau;
					while(hoverPos.theta > tau) hoverPos.theta -= tau;
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
				context.fillStyle = colors.call(this, value, i, values);
				context.fill();
				
				//Draw focus around hovered rectangle
				if(focusWidth > 0 && hoverPos && hoverPos.theta > start && hoverPos.theta < (start + slice)){
					this.drawArc(context, radius + focusWidth / 2, -start, -(start+slice), true, opts.focusColor, focusWidth);
				}
				start += slice;
			}
			
			if(lineWidth > 0){ this.drawArc(context, radius + lineWidth / 2, 0, tau, true, opts.lineColor, lineWidth); }
			if(focusWidth > 0 ){ this.addEvents(); }
		}
	);
	
	//Line Chart
	peity.register("line", {
			color: "#cdf",
			lineColor: "#48f", lineWidth: 1,
			delimiter: ",",
			height: 16, width: 32,
			max: null, min: 0,
			fill : true
		},
		function(opts) {
			var values = this.values();
			if(values.length == 1) values.push(values[0]);
			var max = Math.max.apply(Math, values.concat([opts.max]));
			var min = Math.min.apply(Math, values.concat([opts.min]));
			
			var canvas = this.prepareCanvas(opts.width, opts.height);
			var context = this.context;
			var width = canvas.width;
			var height = canvas.height;
			
			var xQuotient = width / (values.length - 1);
			var yQuotient = height / (max - min);
			
			var coords = [];
			var i;
			
			context.beginPath();
			context.moveTo(0, height + (min * yQuotient));
			for (i = 0; i < values.length; i++) {
				var x = i * xQuotient;
				var y = height - (yQuotient * (values[i] - min));
				
				coords.push({ x: x, y: y });
				context.lineTo(x, y);
			}
			context.lineTo(width, height + (min * yQuotient));
			
			if(opts.fill){
				context.fillStyle = opts.color;
				context.fill();
			}
			
			//Draw line second to make sure it's on top of fill
			if (opts.lineWidth) {
				context.beginPath();
				context.moveTo(0, coords[0].y);
				for (i = 0; i < coords.length; i++) {
					context.lineTo(coords[i].x, coords[i].y);
				}
				context.lineWidth = opts.lineWidth * devicePixelRatio;
				context.strokeStyle = opts.lineColor;
				context.stroke();
			}
		}
	);

	//Multi Line Chart
	peity.register("multiline", {
			colors: ["#666666", "#803E75", "#FF6800"],
			lineColor: "#4d89f9",
			lineWidth: 1,
			delimiter: ",",
			seriesDelimiter : "|",
			height: 16,
			max: null,
			min: 0,
			width: 32
		},
		function(opts) {
			var values = this.values();
			var allValues = [].concat.apply([], values);
			var max = Math.max.apply(Math, allValues.concat([opts.max]));
			var min = Math.min.apply(Math, allValues.concat([opts.min]));
			var canvas = this.prepareCanvas(opts.width, opts.height);
			var context = this.context;
			var width = canvas.width;
			var height = canvas.height;
			var xQuotient = width / (values[1].length - 1);
			var yQuotient = height / (max - min);
			var colors = opts.colors;
			
			var i, j, series, coords;
			context.lineWidth = opts.lineWidth * devicePixelRatio;
			
			//Create baseline
			coords = [{x : 0, y: height - (yQuotient * (0 - min)) }, {x : width, y: height - (yQuotient * (0 - min)) }];
			context.beginPath();
			context.moveTo(0, coords[0].y);
			for (i = 0; i < coords.length; i++) context.lineTo(coords[i].x, coords[i].y);
			//Draw in specified color
			context.strokeStyle = colors[0 % colors.length];
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
				context.strokeStyle = colors[(j+1) % colors.length];
				context.stroke();
			}
		}
	);

	//Bar chart
	peity.register('bar', {
			colors: ["#48f"],
			baselineColor : "#000", baselineHeight : 1,
			fontColour : "#000", fontStyle : "12pt Arial, sans-serif",
			focusColor : "#000", focusWidth : 0,
			height: 16, width: 32,
			max: null, min: 0,
			delimiter: ",",
			spacing: 1
		},
		function(opts) {
			//Declare variables
			var i, x, y, h, w, value;
			
			//Find minimum and maximum in values to determine range
			var values = this.values();
			var max = Math.max.apply(Math, values.concat([opts.max]));
			var min = Math.min.apply(Math, values.concat([opts.min]));
			
			//Assign elements and options to variables
			var element = this.$el;
			var hoverPos = element.data("position");
			var canvas = this.prepareCanvas(opts.width, opts.height);
			var context = this.context;
			
			var spacing = opts.spacing;
			var colors = this.colors();
			var focusWidth = opts.focusWidth;
			var baselineHeight = opts.baselineHeight;
			
			//Size
			var fullWidth = canvas.width;
			var fullHeight = canvas.height;
			var width = fullWidth - spacing * 2;
			var height = fullHeight - spacing * 2;
			if(baselineHeight) height -= 1;
			var yQuotient = height / (max - min);//Height of bar of value 1
			var xQuotient = (width + spacing) / values.length;//Width of bar
			var middle = yQuotient * max + spacing;
			
			//Draw baseline
			context.fillStyle = opts.baselineColor;
			context.fillRect(0, middle - (baselineHeight / 2),fullWidth, baselineHeight);
			
			//Loop through values and draw each bar
			var prevColor, nowColor;
			for (i = 0; i < values.length; i++) {
				//X position and width
				x = spacing + i * xQuotient;
				w = xQuotient - spacing;
				
				//Use value to determine height
				value = values[i];
				y = spacing + height - (yQuotient * (value - min));
				if (value === 0) {//Special case for 0 - make 1px high in middle
					if (min >= 0 || max > 0) y -= 1;
					h = 1;
				} else { h = yQuotient * values[i]; }
				
				//Draw the bar
				nowColor = colors.call(this, value, i, values);
				if(nowColor !== prevColor) context.fillStyle = nowColor;
				context.fillRect(x, y, w, h);
			}
			//Draw focus around hovered rectangle and write value
			if(focusWidth > 0 && hoverPos){
				hoverPos = JSON.parse(hoverPos);
				//Loop through values again
				for (i = 0; i < values.length; i++) {
					
					//Check if mouse is within this bar's horizontal space
					x = spacing + i * xQuotient;
					w = xQuotient - spacing;
					if(hoverPos.x >= x && hoverPos.x <= x+w){
						
						//Now check if mouse is within this bar's vertical space
						value = values[i];
						y = spacing + height - (yQuotient * (value - min));
						if (value === 0) {
							if (min >= 0 || max > 0) y -= 1;
							h = 1;
						} else {
							h = yQuotient * values[i];
						}
						
						//To make comparison easier, make h positive and adjust y
						y = y + Math.min(h, 0);
						h = Math.abs(h);
						if(hoverPos.y >= y && hoverPos.y <= y+h){
							//If mouse is within a bar, draw a focus
							context.strokeStyle=opts.focusColor;
							context.lineWidth=focusWidth;
							context.strokeRect(
								x - focusWidth / 2,
								y - focusWidth / 2,
								w + focusWidth,
								h + focusWidth
							);
							context.fillStyle = opts.fontColour;
							context.font = opts.fontStyle;
							if(hoverPos.x > fullWidth / 2) context.textAlign = "right";
							if(hoverPos.y < fullHeight / 2) { context.textBaseline = "top"; hoverPos.y += 20; }
							context.fillText(value + "",hoverPos.x,hoverPos.y);
						}
					}
				}
			}
			
			if(focusWidth > 0 ){ this.addEvents(); }
		}
	);
	
	//Future Combo chart
})(jQuery, document, window.devicePixelRatio || 1);
