// Peity jQuery plugin version 1.2.1
// (c) 2013 Ben Pickles
//
// http://benpickles.github.io/peity
//
// Released under MIT license.
(function($, Math) {
	var canvasSupported = document.createElement("canvas").getContext;
	var peity = $.fn.peity = function(type, options) {
		if(canvasSupported) {
			this.each(function() {
				var $this = $(this);
				var chart = $this.data("peity");

				if(chart) {
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

					$this.change(function(a, b, c) { chart.draw(); }).data("peity", chart);
				}
			});
		}
		return this;
	};

	var Peity = function($el, type, opt) { this.$el = $el; this.type = type; this.opt = opt; };
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

	PeityPrototype.drawArc = function(context, x, y, r, start, end, color, width) {
		context.beginPath();
		context.arc(x, y, r, start, end, true);//true = counterclockwise
		PeityPrototype.setLineStyle(context, color, width);
		context.stroke();
	};

	PeityPrototype.drawCircle = function(context, x, y, r, start, end, color) {
		context.beginPath();
		context.moveTo(x, y);
		context.arc(x, y, r, start, end, true);//true = counterclockwise
		context.fillStyle = color;
		context.fill();
	};

	PeityPrototype.drawLine = function(context, points, color, width) {
		context.beginPath();
		context.moveTo(points[0].x, points[0].y);
		for(var i = 1; i < points.length; i++) context.lineTo(points[i].x, points[i].y);
		this.setLineStyle(context, color, width);
		context.stroke();
	};

	PeityPrototype.drawGrid = function(context, baseWidth, gridWidth, baseColor, gridColor, fontColor, fontSize, formatter, left, right, height, yQuotient, min, max, region, gap) {
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

				//Draw label
				context.fillStyle = fontColor;
				context.font = fontSize + "px sans-serif";
				context.textAlign = "right";
				context.textBaseline = valueToY() > fontSize / 2 ? valueToY() > height - fontSize / 2 ? "bottom" : "middle" : "top";
				context.fillText(formatter(value) + "", left - 1, valueToY());
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
	peity.register("line", {
		fill: "#cdf",
		lineColor: "#48f", lineWidth: 1,
		fontColor: "#000", fontSize: 13, formatter: function(e) { return e; },
		delimiter: ",",
		height: 150, width: 400, left: 0,
		max: null, min: 0,
		pointSize: 3, focus: false,
		gridlines: [1, 0], gridlineColors: ["#000", "#bbb"]
	},
		function(opt) {
			var self = this;
			var hoverPos = self.$el.data("mouse");
			var values = self.values();
			if(values.length == 1) values.push(values[0]);
			var max = Math.max.apply(Math, values.concat([opt.max]));
			var min = Math.min.apply(Math, values.concat([opt.min]));
			var region = opt.region || ((max - min) / 5);
			var lineWidth = opt.lineWidth;
			var pointSize = opt.pointSize;
			var focus = opt.focus;
			var fontColor = opt.fontColor;
			var fontSize = opt.fontSize;
			var formatter = opt.formatter;

			var canvas = self.prepareCanvas(opt.width, opt.height);
			var context = self.context;
			var left = opt.left + pointSize;
			var fullWidth = canvas.width;
			var width = fullWidth - pointSize - left;
			var height = canvas.height - lineWidth;

			var xQuotient = width / (values.length - 1);
			var yQuotient = height / (max - min);
			var baseline = height + min * yQuotient;

			var coords = [];
			var i;

			//Trace path for fill (and save point coordinates for the line afterwards)
			context.beginPath();
			context.moveTo(left, baseline);
			for(i = 0; i < values.length; i++) {
				var x = i * xQuotient + left;
				var y = baseline - yQuotient * values[i] + lineWidth / 2;

				coords.push({ x: x, y: y });
				context.lineTo(x, y);

			}
			context.lineTo(fullWidth, baseline);

			if(opt.fill) {
				context.fillStyle = opt.fill;
				context.fill();
			}
			var gridlines = opt.gridlines, gridlineColors = opt.gridlineColors;
			self.drawGrid(context, gridlines[0], gridlines[1], gridlineColors[0], gridlineColors[1], fontColor, fontSize, formatter, left, fullWidth, height, yQuotient, min, max, region, 0);

			//Draw line second to make sure it's on top of fill
			if(lineWidth) { self.drawLine(context, coords, opt.lineColor, lineWidth); }

			//Finally draw points
			if(opt.pointSize) {
				for(i = 0; i < coords.length; i++) self.drawCircle(context, coords[i].x, coords[i].y, opt.pointSize, 0, 2 * Math.PI, opt.lineColor);
			}

			//Draw focus around hovered rectangle and write value
			if(focus && hoverPos) {
				hoverPos = JSON.parse(hoverPos);

				//Loop through values again
				for(i = 0; i < coords.length; i++) {
					var box = coords[i];
					//Check if mouse is within the point's double space
					if(hoverPos.x >= box.x - xQuotient / 3 && hoverPos.x <= box.x + xQuotient / 3) {
						//Draw label
						context.fillStyle = opt.fontColor;
						context.font = opt.fontSize;
						if(hoverPos.x > fullWidth / 2) context.textAlign = "right";
						if(hoverPos.y < height / 2) {
							context.textBaseline = "top";
							hoverPos.y += 20;
						}
						context.fillText(formatter(values[i]) + "", hoverPos.x, hoverPos.y);

						break;//Don't analyze other values
					}
				}
			}

			if(focus) { self.addEvents(canvas); }
		}
	);

	//Multi Line Chart
	peity.register("lines", {
		lineColors: ["#666666", "#803E75"], lineWidths: [1],
		fontColor: "#000", fontSize: 13, formatter: function(e) { return e; },
		delimiter: ",", seriesDelimiter: "|",
		height: 16, width: 32, left: 0,
		max: null, min: 0,
		pointSizes: [2],
		gridlines: [1, 1], gridlineColors: ["#000", "#bbb"]
	},
		function(opt) {
			var self = this;
			var hoverPos = self.$el.data("mouse");
			var values = self.values(), value;
			var pointSizes = opt.pointSizes;
			var allValues = [].concat.apply([opt.max, opt.min], values);
			var max = Math.max.apply(Math, allValues);
			var min = Math.min.apply(Math, allValues);
			var region = opt.region || ((max - min) / 5);
			var canvas = self.prepareCanvas(opt.width, opt.height);
			var context = self.context;
			var left = opt.left;
			var fullWidth = canvas.width;
			var width = fullWidth - Math.max.apply(Math, pointSizes) * 2 - left;
			var height = canvas.height;
			var xQuotient = width / (values[0].length - 1);
			var yQuotient = height / (max - min);//1 / range of all values, 1 = yQuotient px;
			var lineColors = opt.lineColors;
			var lineWidths = opt.lineWidths;
			var gridlines = opt.gridlines;
			var gridlineColors = opt.gridlineColors;
			var valueToY = function() { return height - (yQuotient * (value - min)); };

			var fontSize = opt.fontSize;
			var fontColor = opt.fontColor;
			var formatter = opt.formatter;

			var i, j, series, coords, firstCoords;
			self.drawGrid(context, gridlines[0], gridlines[1], gridlineColors[0], gridlineColors[1], fontColor, fontSize, formatter, left, fullWidth, height, yQuotient, min, max, region, 0);

			//Loop through each series then each value in the series
			for(j = 0; j < values.length; j += 1) {
				series = values[j];
				coords = [];

				//Calculate coordinates for each value
				for(i = 0; i < series.length; i++) {
					value = series[i]
					coords.push({ x: i * xQuotient + pointSizes[j % pointSizes.length] + left, y: valueToY() });
					self.drawCircle(context, coords[i].x, coords[i].y, pointSizes[j % pointSizes.length], 0, 2 * Math.PI, lineColors[j % lineColors.length]);
				}
				self.drawLine(context, coords, lineColors[j % lineColors.length], lineWidths[j % lineWidths.length]);
				if(j === 0) firstCoords = coords.slice(0);
			}


			//Draw focus around hovered rectangle and write value
			if(focus && hoverPos) {
				hoverPos = JSON.parse(hoverPos);

				//Loop through values again
				for(i = 0; i < firstCoords.length; i++) {
					var box = firstCoords[i];
					//Check if mouse is within the point's double space
					if(hoverPos.x >= box.x - xQuotient / 3 && hoverPos.x <= box.x + xQuotient / 3) {
						//Draw label
						context.font = opt.fontSize;
						context.textAlign = "right";
						if(hoverPos.y < height / 2) {
							context.textBaseline = "top"; hoverPos.y += fontSize;
						} else {
							context.textBaseline = "bottom"; hoverPos.y -= fontSize;
						}
						values.forEach(function(e, j) {
							context.fillStyle = lineColors[j % lineColors.length];
							context.fillText((formatter(e[i]) || " ") + " ■", hoverPos.x, hoverPos.y + j * fontSize);
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
		fontColor: "#000", fontSize: 13, formatter: function(e) { return e; },
		focusColor: "#000", focusWidth: 0,
		delimiter: ",",
		height: 16, width: 32, left: 0, gap: 1,
		max: null, min: 0,
		gridlines: [1, 1], gridlineColors: ["#000", "#bbb"]
	},
		function(opt) {
			//Declare variables
			var i, x, y, h, w, value;
			var self = this;

			//Find minimum and maximum in values to determine range
			var values = self.values();
			var max = Math.max.apply(Math, values.concat([opt.max]));
			var min = Math.min.apply(Math, values.concat([opt.min]));
			var region = opt.region || ((max - min) / 5);

			//Assign elements and options to variables
			var hoverPos = self.$el.data("mouse");
			var canvas = self.prepareCanvas(opt.width, opt.height);
			var context = self.context;

			var gap = opt.gap;
			var fill = self.fill();
			var focusWidth = opt.focusWidth;
			var gridlines = opt.gridlines;
			var gridlineColors = opt.gridlineColors;
			var fontSize = opt.fontSize;
			var fontColor = opt.fontColor;
			var formatter = opt.formatter;

			//Size
			var fullWidth = canvas.width;
			var fullHeight = canvas.height;
			var left = opt.left;
			var width = fullWidth - gap * 2 - left;
			var height = fullHeight - gap * 2 - gridlines[0];
			var yQuotient = height / (max - min);//Height of bar of value 1
			var xQuotient = (width + gap) / values.length;//Width of bar
			var middle = yQuotient * max + gap;
			var valueToY = function() { return height - (yQuotient * (value - min)) + gap; };

			self.drawGrid(context, gridlines[0], gridlines[1], gridlineColors[0], gridlineColors[1], fontColor, fontSize, formatter, left, fullWidth, height, yQuotient, min, max, region, gap);

			//Loop through values and draw each bar
			var boxes = [];
			for(i = 0; i < values.length; i++) {
				value = values[i];
				boxes.push([
					gap + i * xQuotient + left,//x
					valueToY(),//y
					xQuotient - gap,//w
					value === 0 ? 1 : yQuotient * value//h
				]);

				//Draw the bar
				context.fillStyle = fill.call(self, value, i, values);
				context.fillRect.apply(context, boxes[i]);
			}

			//Draw focus around hovered rectangle and write value
			if(focusWidth && hoverPos) {
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
							self.setLineStyle(context, opt.focusColor, focusWidth);
							context.strokeRect(
								box[0] - focusWidth / 2, box[1] - focusWidth / 2,
								box[2] + focusWidth, box[3] + focusWidth
							);
							//Draw label
							context.fillStyle = fontColor;
							context.font = fontSize;
							if(hoverPos.x > fullWidth / 2) context.textAlign = "right";
							if(hoverPos.y < fullHeight / 2) {
								context.textBaseline = "top";
								hoverPos.y += 20;
							}
							context.fillText(formatter(values[i]) + "", hoverPos.x, hoverPos.y);
						}
						break;//Don't analyze other values
					}
				}
			}

			if(focusWidth) { self.addEvents(canvas); }
		}
	);
})(jQuery, Math);