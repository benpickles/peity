// Peity jQuery plugin version 1.2.1
// (c) 2013 Ben Pickles
//
// http://benpickles.github.io/peity
//
// Released under MIT license.
(function($, Math) {
	var canvasSupported = document.createElement("canvas").getContext;
	var defaultAxis = { color: "#000", size: 13, formatter: function(e) { return e; } };
	var peity = $.fn.peity = function(type, options) {
		if(canvasSupported) {
			this.each(function() {
				//See if element is already a peity chart and load
				var $this = $(this);
				var chart = $this.data("peity");

				if(chart) {
					//If chart already exists, pass new options and redraw
					if(type) chart.type = type;
					$.extend(true, chart.opt, options);
					chart.draw();
				} else {
					//Initialize with defaults
					var defaults = peity.defaults[type];
					//Then load from data attributes on element
					var data = {};
					$.each($this.data(), function(name, value) { if(name in defaults) data[name] = value; });
					//Then combine with passed options
					var opt = $.extend(true, {}, defaults, data, options);

					//Create and draw
					chart = new Peity($this, type, opt);
					chart.draw();

					//Adds change handler that redraws the chart
					$this.change(function(a, b, c) { chart.draw(); }).data("peity", chart);
				}
			});
		}
		return this;
	};

	//Create object with defaults and drawers
	var Peity = function($el, type, opt) { this.$el = $el; this.type = type; this.opt = opt; };

	//Minifies references to the prototype
	var PeityPrototype = Peity.prototype;

	PeityPrototype.fill = function() {
		var fill = this.opt.fill;
		if($.isFunction(fill)) return fill;
		else return function(value, i) { return fill[i % fill.length]; };
	};

	PeityPrototype.draw = function() { peity.graphers[this.type].call(this, this.opt); };

	//Prepare a canvas element to draw on
	PeityPrototype.prepareCanvas = function(width, height) {
		var self = this;
		var canvas = self.canvas;
		var $canvas;

		//If pre-existing canvas, clear it, otherwise create it.
		if(canvas) {
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
		$(this).prev().data("mouse", JSON.stringify({ x: evt.clientX - rect.left, y: evt.clientY - rect.top })).change();
	};

	//Redraw chart with no hover effect
	PeityPrototype.exitEvent = function(evt) {
		PeityPrototype.removeEvents(this);
		$(this).prev().removeData("mouse").change();
	};

	//Remove event listeners from pie and bar charts to avoid infinite redrawing of hover effects
	PeityPrototype.removeEvents = function(node) {
		node.removeEventListener("mouseout", node.exitEvent, false);
		node.removeEventListener("mousemove", node.hoverEvent, false);
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
		var splitter = function(e) { return e.split(delim).map(function(value) { return parseFloat(value); }); };
		if(series) return text.split(series).map(splitter);
		else return splitter(text);
	};

	//Add event listeners to pie and bar charts to redraw hover effects
	PeityPrototype.setLineStyle = function(context, color, width) {
		context.lineWidth = width;
		context.strokeStyle = color;
	};

	//Draw an arc
	PeityPrototype.drawArc = function(context, x, y, r, start, end, color, width) {
		context.beginPath();
		context.arc(x, y, r, start, end, true);//true = counterclockwise
		PeityPrototype.setLineStyle(context, color, width);
		context.stroke();
	};

	//Draw a circle
	PeityPrototype.drawCircle = function(context, x, y, r, start, end, color) {
		context.beginPath();
		context.moveTo(x, y);
		context.arc(x, y, r, start, end, true);//true = counterclockwise
		context.fillStyle = color;
		context.fill();
	};

	//Draw a line
	PeityPrototype.drawLine = function(context, points, color, width) {
		context.beginPath();
		context.moveTo(points[0].x, points[0].y);
		for(var i = 1; i < points.length; i++) context.lineTo(points[i].x, points[i].y);
		this.setLineStyle(context, color, width);
		context.stroke();
	};

	//Draw y-axis gridlines and left labels
	PeityPrototype.drawYAxis = function(context, baseWidth, gridWidth, baseColor, gridColor, fontColor, fontSize, formatter, left, right, height, yQuotient, min, max, region, gap) {
		var valueToY = function() { return height - (yQuotient * (value - min)) + gap; };
		var value = 0;
		//Baseline
		if(baseWidth) {
			context.beginPath();
			context.moveTo(left, valueToY());
			context.lineTo(right, valueToY());
			//Draw in specified color
			this.setLineStyle(context, baseColor, baseWidth);
			context.stroke();
		}

		//Gridlines
		if(gridWidth) {
			this.setLineStyle(context, gridColor, gridWidth);
			for(value = min; value <= max; value += region) {
				context.beginPath();
				context.moveTo(left, valueToY());
				context.lineTo(right, valueToY());
				context.stroke();
				if(left > 3) {
					//Draw label
					context.fillStyle = fontColor;
					context.font = fontSize + "px sans-serif";
					context.textAlign = "right";
					context.textBaseline = valueToY() > fontSize / 2 ? valueToY() > height - fontSize / 2 ? "bottom" : "middle" : "top";
					context.fillText(formatter(value) + "", left - 1, valueToY());
				}
			}
		}

	}

	//Draw x-axis labels if given
	PeityPrototype.drawXAxis = function(context, color, size, y, points, labels) {
		context.fillStyle = color;
		context.font = size + "px sans-serif";
		context.textBaseline = "top";
		context.textAlign = "center";
		for(var i = 0; i < points.length; i++) {
			var pieces = labels[i].split(" ");
			for(var j = 0; j < pieces.length;j++){
				context.fillText(pieces[j], points[i].x, y + 1 + j * size); 
			}
		}
	}

	//Default options and drawing functions per type
	peity.defaults = {}; peity.graphers = {};
	peity.register = function(type, defaults, grapher) { this.defaults[type] = defaults; this.graphers[type] = grapher; };

	//Pie chart
	peity.register("pie", {
		fill: ["#f90", "#ffd", "#fc6"],
		lineColor: "#000", lineWidth: 0,
		focusColor: "#000", focusWidth: 0,
		delimiter: null,
		diameter: 16
	},
		function(opt) {
			var self = this;
			if(!opt.delimiter) {
				//Default to first non-digit and non-period character found, or comma
				var delimiter = self.$el.text().match(/[^0-9\.]/);
				opt.delimiter = delimiter ? delimiter[0] : ",";
			}

			var values = self.values();
			//If something like 3/5, then this makes 3 and 2
			if(opt.delimiter === "/") { values = [values[0], values[1] - values[0]]; }

			var i, sum = 0, length = values.length;
			for(i = 0; i < length; i++) { sum += values[i]; }

			//Try width and height, but default to diameter (add 1 for a slight offset from edge)
			var element = self.$el;
			var hoverPos = element.data("mouse");
			var focusWidth = opt.focusWidth;
			var lineWidth = opt.lineWidth;
			var padding = Math.max(focusWidth, lineWidth) + 1;
			var diameter = opt.diameter;
			var canvas = self.prepareCanvas(diameter + padding, diameter + padding);
			var context = self.context;
			var width = canvas.width;
			var height = canvas.height;
			var radius = width / 2 - padding;
			var pi = Math.PI;
			var tau = 2 * pi;
			var unit = tau / sum;
			var fill = self.fill();

			if(focusWidth && hoverPos) {
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
			for(i = 0; i < length; i++) {
				value = values[i];
				slice = value * unit;//Size of slice
				self.drawCircle(context, 0, 0, radius, -start, -(start + slice), fill.call(self, value, i, values));

				//Draw focus around hovered rectangle
				if(focusWidth && hoverPos && hoverPos.a > start && hoverPos.a < (start + slice)) {
					self.drawArc(context, 0, 0, radius + focusWidth / 2, -start, -(start + slice), opt.focusColor, focusWidth);
				}
				start += slice;
			}

			if(lineWidth) { self.drawArc(context, 0, 0, radius + lineWidth / 2, 0, tau, opt.lineColor, lineWidth); }
			if(focusWidth) { self.addEvents(canvas); }
		}
	);

	//Line Chart
	peity.register("lines", {
		lineColors: ["#78A", "#827"], lineWidths: [1],
		fill : "#cdf",
		delimiter: ",", seriesDelimiter: "|",
		height: 32, width: 32, left: 0,
		max: null, min: 0,
		pointSizes: [2],
		xAxis: defaultAxis,
		yAxis: defaultAxis,
		focus: false,
		tooltip: defaultAxis,
		gridlines: { widths: [1, 0], colors: ["#000", "#bbb"] }
	},
		function(opt) {
			var self = this;
			var hoverPos = self.$el.data("mouse");
			var values = self.values(), value;
			var pointSizes = opt.pointSizes;
			var xAxis = opt.xAxis;
			var yAxis = opt.yAxis;
			var focus = opt.focus;
			var tooltip = opt.tooltip;
			var gridlines = opt.gridlines;
			var allValues = [].concat.apply([opt.max, opt.min], values);
			var labels = opt.labels;
			if(labels) labels = labels.map(function(e) { return e + ""; });
			var levels = 0;
			if(labels) levels = Math.max.apply(this, labels.map(function(e) { return e.replace(/[^ ]/g, "").length; })) + 1;
			var max = Math.max.apply(Math, allValues);
			var min = Math.min.apply(Math, allValues);
			var region = opt.region || ((max - min) / 5);
			max = Math.ceil(max / region) * region;
			min = Math.floor(min / region) * region;
			var canvas = self.prepareCanvas(opt.width, opt.height);
			var context = self.context;
			var left = opt.left;
			var bottom = levels * xAxis.size + (levels ? 4 : 0);
			var fullWidth = canvas.width;
			var width = fullWidth - Math.max.apply(Math, pointSizes) * 2 - left;
			var height = canvas.height - bottom;
			var xQuotient = width / (values[0].length - 0.5);
			var yQuotient = height / (max - min);//1 / range of all values, 1 = yQuotient px;
			var lineColors = opt.lineColors;
			var lineWidths = opt.lineWidths;
			var gridlines = opt.gridlines;
			var gridlineColors = opt.gridlineColors;
			var valueToY = function() { return height - (yQuotient * (value - min)); };

			var fontSize = opt.fontSize;
			var fontColor = opt.fontColor;
			var formatter = opt.formatter;

			var i, j, series, coords, allCoords = [];


			

			//Loop through each series then each value in the series
			for(j = 0; j < values.length; j += 1) {
				series = values[j];
				coords = [];

				//Calculate coordinates for each value
				for(i = 0; i < series.length; i++) {
					value = series[i];
					coords.push({ x: i * xQuotient + pointSizes[j % pointSizes.length] + left + xQuotient / 4, y: valueToY() });
				}
				if(opt.fill && values.length === 1) {
					//Trace path for fill (and save point coordinates for the line afterwards)
					context.beginPath();
					value = 0;
					context.moveTo(left + xQuotient / 4 + pointSizes[0], valueToY());
					for(i = 0; i < coords.length; i++) { context.lineTo(coords[i].x, coords[i].y); }
					value = 0;
					context.lineTo(fullWidth - pointSizes[0] - xQuotient / 4, valueToY());
					context.fillStyle = opt.fill;
					context.fill();
				}
				allCoords.push(coords);
			}

			self.drawYAxis(context, gridlines.widths[0], gridlines.widths[1], gridlines.colors[0], gridlines.colors[1], yAxis.color, yAxis.size, yAxis.formatter, left, fullWidth, height, yQuotient, min, max, region, 0);

			for(j = 0; j < values.length; j += 1) {
				coords = allCoords[j];
				for(i = 0; i < coords.length; i++) self.drawCircle(context, coords[i].x, coords[i].y, pointSizes[j % pointSizes.length], 0, 2 * Math.PI, lineColors[j % lineColors.length]);
				self.drawLine(context, coords, lineColors[j % lineColors.length], lineWidths[j % lineWidths.length]);
			}

			//Draw x-axis
			if(levels) { self.drawXAxis(context, xAxis.color, xAxis.size, height, allCoords[0], labels); }

			//Draw focus around hovered rectangle and write value
			
			if(focus && hoverPos) {
				hoverPos = JSON.parse(hoverPos);
				
				//Loop through values again
				for(i = 0; i < allCoords[0].length; i++) {
					var box = allCoords[0][i];
					//Check if mouse is within the point's double space
					if(hoverPos.x >= box.x - xQuotient / 3 && hoverPos.x <= box.x + xQuotient / 3) {
						//Draw label
						context.font = tooltip.size + "px sans-serif";
						context.textAlign = "right";
						if(hoverPos.y < height / 2) {
							context.textBaseline = "top"; hoverPos.y += tooltip.size;
						} else {
							context.textBaseline = "bottom"; hoverPos.y -= tooltip.size;
						}
						values.forEach(function(e, j) {
							context.fillStyle = lineColors[j % lineColors.length];
							context.fillText((tooltip.formatter(e[i]) || " ") + " ■", hoverPos.x, hoverPos.y + j * tooltip.size);
						});

						break;//Don't analyze other values
					}
				}
			}

			if(focus) { self.addEvents(canvas); }
		}
	);

	//Bar chart
	peity.register("bar", {
		fill: ["#48f"],
		delimiter: ",",
		height: 16, width: 32, left: 0,
		gap: 1,
		xAxis: defaultAxis,
		yAxis: defaultAxis,
		focus: { color: "#000", width: 0 },
		tooltip: defaultAxis,
		gridlines: { widths: [1, 0], colors: ["#000", "#bbb"] },
		max: null, min: 0
	},
		function(opt) {
			//Declare variables
			var i, x, y, h, w, value;
			var self = this;

			//Find minimum and maximum in values to determine range
			var values = self.values();
			var labels = opt.labels;
			if(labels) labels = labels.map(function(e) { return e + ""; });
			var levels = 0;
			if(labels) levels = Math.max.apply(this, labels.map(function(e) { return e.replace(/[^ ]/g, "").length; })) + 1;
			var max = Math.max.apply(Math, values.concat([opt.max]));
			var min = Math.min.apply(Math, values.concat([opt.min]));
			var region = opt.region || ((max - min) / 5);
			max = Math.ceil(max / region) * region;
			min = Math.floor(min / region) * region;

			//Prepare canvas
			var hoverPos = self.$el.data("mouse");
			var canvas = self.prepareCanvas(opt.width, opt.height);
			var context = self.context;

			//Formatting options
			var fill = self.fill();
			var yAxis = opt.yAxis;
			var xAxis = opt.xAxis;
			var focus = opt.focus;
			var tooltip = opt.tooltip;
			var gridlines = opt.gridlines;

			//Size
			var fullWidth = canvas.width;
			var fullHeight = canvas.height;
			var gap = opt.gap;
			var left = opt.left;
			var bottom = levels * xAxis.size + (levels ? 4 : 0);
			var width = fullWidth - gap * 2 - left;
			var height = fullHeight - bottom - gridlines.widths[0];

			//Value to Pixel conversion
			var yQuotient = height / (max - min);
			var xQuotient = (width + gap) / values.length;
			var middle = yQuotient * max + gap;
			var valueToY = function() { return height - (yQuotient * (value - min)); };

			self.drawYAxis(context, gridlines.widths[0], gridlines.widths[1], gridlines.colors[0], gridlines.colors[1], yAxis.color, yAxis.size, yAxis.formatter, left, fullWidth, height, yQuotient, min, max, region, 0);

			//Loop through values and draw each bar
			var boxes = [];
			for(i = 0; i < values.length; i++) {
				value = values[i];
				boxes.push([
					left + i * xQuotient + gap,//x
					valueToY(),//y
					xQuotient - gap,//w
					value === 0 ? 1 : yQuotient * value//h
				]);

				//Draw the bar
				context.fillStyle = fill.call(self, value, i, values);
				context.fillRect.apply(context, boxes[i]);
			}

			//Draw x-axis
			if(levels) { self.drawXAxis(context, xAxis.color, xAxis.size, height, boxes.map(function(e) { return { x: e[0] + e[2] / 2 }; }), labels); }


			//Draw focus around hovered rectangle and write value
			if(focus.width && hoverPos) {
				hoverPos = JSON.parse(hoverPos);

				//Loop through values again
				for(i = 0; i < boxes.length; i++) {
					var box = boxes[i];
					//Check if mouse is within this bar's horizontal space
					if(hoverPos.x >= box[0] && hoverPos.x <= box[0] + box[2]) {
						//Now check if mouse is within this bar's vertical space
						//To make comparison easier, make h positive and adjust y
						box[1] += Math.min(box[3], 0);
						box[3] = Math.abs(box[3]);
						if(hoverPos.y >= box[1] && hoverPos.y <= box[1] + box[3]) {
							//If mouse is within a bar, draw a focus
							self.setLineStyle(context, focus.color, focus.width);
							context.strokeRect(
								box[0] - focus.width / 2, box[1] - focus.width / 2,
								box[2] + focus.width, box[3] + focus.width
							);
							//Draw label
							context.fillStyle = tooltip.color;
							context.font = tooltip.size + "px sans-serif";
							if(hoverPos.x > fullWidth / 2) context.textAlign = "right";
							if(hoverPos.y < fullHeight / 2) {
								context.textBaseline = "top";
								hoverPos.y += 20;
							} else {
								context.textBaseline = "bottom";
							}
							context.fillText(tooltip.formatter(values[i]) + "", hoverPos.x, hoverPos.y);
						}
						break;//Don't analyze other values
					}
				}
			}

			if(focus.width) { self.addEvents(canvas); }
		}
	);
})(jQuery, Math);