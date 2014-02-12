// Peity jQuery plugin version 1.2.1
// (c) 2013 Ben Pickles
// http://benpickles.github.io/peity
//
// Peity jQuery plugin version 0.9.0
// (c) 2014 Fred Morel
// http://fmorel90.github.io/peity
//
// Released under MIT license.
(function($, Math) {
	var canvasSupported = document.createElement("canvas").getContext;

	var peity = $.fn.peity = function(type, options) {
		if(canvasSupported) {
			this.each(function() {
				//See if element is already a peity chart and load
				var $this = $(this);
				var chart = $this.data("peity");

				if(chart) {
					//If chart already exists, pass new options and redraw
					if(type) { chart.type = type; }
					$.extend(true, chart.opt, options);
					chart.draw();
				} else {
					//Initialize with defaults
					var defaults = peity.defaults[type];
					//Then load from data attributes on element
					var data = {};
					$.each($this.data(), function(name, value) { data[name] = value; });
					//Then combine with passed options
					var opt = $.extend({}, defaults, data, options);

					//Create and draw
					chart = new Peity($this, type, opt);
					chart.draw();

					//Adds change handler that redraws the chart
					$this.change(function() { chart.draw(); }).data("peity", chart);
				}
			});
		}
		return this;
	};

	//Create object with defaults and drawers
	var Peity = function($el, type, opt) { this.$el = $el; this.type = type; this.opt = opt; };

	//Minifies references to the prototype
	var PeityPrototype = Peity.prototype;

	//Converts fill array to fill function (pass value to fill)
	PeityPrototype.fill = function() {
		var fill = this.opt.fill;

		//If given an array of fills (multiple colors for one series and/or multiple series
		if($.isArray(fill)) {
			//If first item is sub-array or function, that means there are multiple series
			if($.isArray(fill[0]) || $.isFunction(fill[0])) {
				//Return array of functions (original function if given, otherwise function to return relevant array element
				return fill.map(function(e) {
					if($.isFunction(e)) { return e; }
					return function(value, i) { return e[i % e.length]; };
				});
			}
			//If only one series, return function to return relevant element
			return function(value, i) { return fill[i % fill.length]; };
		}
		//If any other type of object or already a function, return it
		return fill;
	};

	PeityPrototype.draw = function() { peity.graphers[this.type].call(this, this.opt); };

	//Prepare a canvas element to draw on
	PeityPrototype.prepareCanvas = function(width, height) {
		var self = this;
		var canvas = self.canvas;

		//If pre-existing canvas, clear it, otherwise create it.
		if(canvas) {
			canvas.width = canvas.width;//Reset width to clear it instead of drawing blank rectangle. Fixes flicker in Firefox
		} else {
			var $canvas = $("<canvas class='peity'>").css({ height: height, width: width }).data("peity", self);
			self.canvas = canvas = $canvas[0];
			self.context = canvas.getContext("2d");
			self.$el.hide().after(canvas);
			canvas.height = $canvas.height();
			canvas.width = $canvas.width();
		}
		return canvas;
	};

	//Splits values string into array by delimiter and returns the numbers. Split into multiple series if necessary 
	PeityPrototype.values = function() {
		var delims = arguments;
		var text = this.$el.text().split(delims[0]);
		if(delims.length === 1) return Helpers.parseFloats(text);
		return text.map(function(e) { return Helpers.parseFloats(e.split(delims[1])); });
	};

	//Some common code that's not categorized
	var Helpers = {
		//Default properties for an axis/tooltip (font color and size, plus label formatter)
		defaultText: {
			color: "#000",
			size: 13,
			formatter: function(e) { return e; }
		},
		//Figures out how many levels a label will take (split by space)
		labelLeveler: function(labels) {
			return Math.max.apply(this, labels.map(function(e) { return e.replace(/[^ ]/g, "").length; })) + 1;
		},
		//Given values and formatter, returns strings for text output
		stringifier: function(values, formatter) {
			if(formatter) return values.map(function(e) { return formatter(e) + ""; });
			return values.map(function(e) { return e + ""; });
		},
		//Parse all values of an array as floats
		parseFloats: function(values) {
			return values.map(function(e) { return parseFloat(e); });
		},
		//Function to extract given property from object
		extractor: function(propName) { return function(e) { return e[propName]; }; },
		//Convert array of items to function that returns those
		toFunction : function(items) {
			//If given an array of fills (multiple colors for one series and/or multiple series
			if($.isArray(items)) {
				//If first item is sub-array or function, that means there are multiple series
				if($.isArray(items[0]) || $.isFunction(items[0])) {
					//Return array of functions (original function if given, otherwise function to return relevant array element
					return items.map(function(e) {
						if($.isFunction(e)) { return e; }
						return function(value, i) { return e[i % e.length]; };
					});
				}
				//If only one series, return function to return relevant element
				return function(value, i) { return items[i % items.length]; };
			}
			//If any other type of object or already a function, return it
			return items;
		}
	};

	//Events for point hover
	var Events = {
		//Redraw chart with hover effect based on mouse position
		hover: function(evt) {
			var rect = this.getBoundingClientRect();
			$(this).off().prev().data("mouse", JSON.stringify({ x: evt.clientX - rect.left, y: evt.clientY - rect.top })).change();
		},
		//Redraw chart with no hover effect
		exit: function() {
			$(this).off().prev().removeData("mouse").change();
		}
	};

	//Add event listeners to pie and bar charts to redraw hover effects
	var addEvents = function(node) { $(node).on('mousemove', Events.hover).on('mouseout', Events.hover); };

	//Function to draw specific items
	var Drawers = {
		arc: function(context, x, y, r, start, end, color, width) {
			context.beginPath();
			context.arc(x, y, r, start, end, true);//true = counterclockwise
			context.lineWidth = width;
			context.strokeStyle = color;
			context.stroke();
		},
		circle: function(context, x, y, r, start, end, color) {
			context.beginPath();
			context.moveTo(x, y);
			context.arc(x, y, r, start, end, true);//true = counterclockwise
			context.fillStyle = color;
			context.fill();
		},
		line: function(context, points, color, width) {
			var i;
			context.beginPath();
			context.moveTo(points[0].x, points[0].y);
			for(i = 1; i < points.length; i++) { context.lineTo(points[i].x, points[i].y); }
			context.lineWidth = width;
			context.strokeStyle = color;
			context.stroke();
		},
		rect: function(context, x, y, width, height, fill, strokeWidth, stroke) {
			if(fill) {
				context.fillStyle = fill;
				context.fillRect(x, y, width, height);
			}
			if(stroke) {
				context.strokeStyle = stroke;
				context.lineWidth = strokeWidth;
				context.strokeRect(x, y, width, height);
			}

		}
	};

	//Draw y-axis gridlines and left labels
	Drawers.drawYAxis = function(context, baseWidth, gridWidth, baseColor, gridColor, fontColor, fontSize, formatter, left, right, height, yQuotient, min, max, region, gap) {
		var valueToY = function() { return height - (yQuotient * (value - min)) + gap; };
		var value = 0, y = valueToY();
		//Baseline
		if(baseWidth) { Drawers.line(context, [{ x: left, y: y }, { x: right, y: y }], baseColor, baseWidth); }

		//Gridlines
		if(gridWidth) {
			//Set text styles out here to only set once instead of on every line
			context.fillStyle = fontColor;
			context.font = fontSize + "px sans-serif";
			context.textAlign = "right";

			for(value = min; value <= max; value += region) {
				y = valueToY();
				Drawers.line(context, [{ x: left, y: y }, { x: right, y: y }], gridColor, gridWidth);
				if(left) {
					//Draw label
					context.textBaseline = y > fontSize / 2 ? y > height - fontSize / 2 ? "bottom" : "middle" : "top";
					context.fillText(formatter(value) + "", left - 2, y);
				}
			}
		}

	};

	//Draw x-axis labels if given
	Drawers.drawXAxis = function(context, color, size, y, points, labels) {
		var i, j, pieces;
		context.fillStyle = color;
		context.font = size + "px sans-serif";
		context.textBaseline = "top";
		context.textAlign = "center";
		for(i = 0; i < points.length; i++) {
			pieces = labels[i].split(" ");
			for(j = 0; j < pieces.length; j++) {
				context.fillText(pieces[j], points[i].x, y + 1 + j * size);
			}
		}
	};

	//Draw tooltip for hovered value(s)
	Drawers.tooltip = function(context, x, y, values, colors, fontSize, fontColor, textFormatter) {
		//Set properties
		context.font = fontSize + "px sans-serif";
		context.textAlign = "left";
		context.textBaseline = "top";
		var blockWidth = context.measureText("■").width;

		//Convert values to labels and measure longest
		var strings = Helpers.stringifier(values, textFormatter);
		var textWidth = Math.max.apply([], strings.map(function(e) { return context.measureText(e).width; }));

		//Move tooltip slightly left and adjust based on position within canvas and mouse
		x -= 6;
		if(y > values.length * fontSize + 6) { y -= values.length * fontSize; }
		if(x <= textWidth + blockWidth + 7) { x += textWidth + blockWidth + 20 + 7; }

		//Draw outlined rectangle for tooltip
		Drawers.rect(context, x - textWidth - blockWidth - 4, y - 3, textWidth + blockWidth + 7, values.length * fontSize + 8, "#fff", 1, "#000");

		//Draw each label
		strings.forEach(function(e, i) {
			context.fillStyle = colors[i % colors.length];
			context.fillText("■", x - textWidth - blockWidth - 3, y + i * fontSize);
			context.fillStyle = fontColor;
			context.fillText(e, x - textWidth - 2, y + i * fontSize);
		});
	};

	//Default options and drawing functions per type
	peity.defaults = {}; peity.graphers = {};
	peity.register = function(type, defaults, grapher) { this.defaults[type] = defaults; this.graphers[type] = grapher; };

	//Pie chart
	peity.register("pie", {
		fill: ["#f90", "#ffd", "#fc6"],
		line: { color: "#000", width: 0 },
		focus: { color: "#000", width: 0 },
		delimiter: null,
		diameter: 16,
		tooltip: Helpers.defaultText
	},
		function(opt) {
			var self = this;
			var delimiter = opt.delimiter;
			if(!delimiter) {
				//Default to first non-digit and non-period character found, or comma
				delimiter = self.$el.text().match(/[^0-9\.]/);
				delimiter = delimiter ? delimiter[0] : ",";
			}
			var values = self.values.apply(self, [delimiter]);
			//If something like 3/5, then this makes 3 and 2
			if(delimiter === "/") { values = [values[0], values[1] - values[0]]; }

			var i, sum = 0, length = values.length;
			for(i = 0; i < length; i++) { sum += values[i]; }

			//Try width and height, but default to diameter (add 1 for a slight offset from edge)
			var hoverPos = self.$el.data("mouse");
			var focus = opt.focus;
			var line = opt.line;
			var padding = Math.max(focus.width, line.width) + 1;
			var diameter = opt.diameter;
			var canvas = self.prepareCanvas(diameter + padding, diameter + padding);
			var context = self.context;
			var width = canvas.width;
			var height = canvas.height;
			var radius = width / 2 - padding;
			var pi = Math.PI;
			var tau = 2 * pi;
			var unit = tau / sum;
			var fill = Helpers.toFunction(opt.fill);
			var tooltip = opt.tooltip;
			var focusI;

			if(focus.width && hoverPos) {
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
			context.save();
			context.translate(width / 2, height / 2);

			var value, slice, start = 0;
			for(i = 0; i < length; i++) {
				value = values[i];
				slice = value * unit;//Size of slice
				Drawers.circle(context, 0, 0, radius, -start, -(start + slice), fill.call(self, value, i, values));

				//Draw focus around hovered rectangle
				if(focus.width && hoverPos && hoverPos.a > start && hoverPos.a < (start + slice) && hoverPos.r < radius) {
					Drawers.arc(context, 0, 0, radius + focus.width / 2, -start, -(start + slice), focus.color, focus.width);
					focusI = i;
				}
				start += slice;
			}

			if(line.width) { Drawers.arc(context, 0, 0, radius + line.width / 2, 0, tau, line.color, line.width); }
			if(focus.width) {
				if(hoverPos && focusI !== undefined) {
					hoverPos = JSON.parse(self.$el.data("mouse"));
					context.restore();
					Drawers.tooltip(context, hoverPos.x, hoverPos.y, [values[focusI]], [fill.call(self, values[focusI], focusI, values)], tooltip.size, tooltip.color, tooltip.formatter);
				}
				addEvents(canvas);
			}
		}
	);

	//Line Chart
	peity.register("line", {
		lineColors: ["#78A", "#827"], lineWidths: [1],
		fill: "#cdf",
		delimiters: ["|", ","],
		height: 32, width: 32, left: 0,
		max: null, min: 0,
		pointSizes: [2],
		xAxis: Helpers.defaultText, yAxis: Helpers.defaultText, tooltip: Helpers.defaultText,
		focus: false,
		gridlines: { widths: [1, 0], colors: ["#000", "#bbb"] }
	},
		function(opt) {
			var self = this;
			var hoverPos = self.$el.data("mouse");
			var values = self.values.apply(self, opt.delimiters);
			var value;
			var pointSizes = opt.pointSizes;
			var xAxis = opt.xAxis;
			var yAxis = opt.yAxis;
			var focus = opt.focus;
			var tooltip = opt.tooltip;
			var gridlines = opt.gridlines;
			var allValues = [].concat.apply([opt.max, opt.min], values);
			var labels = opt.labels;
			var levels = 0;
			if(labels) {
				labels = Helpers.stringifier(labels);
				levels = Helpers.labelLeveler(labels);
			}
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
			var lineColors = Helpers.toFunction(opt.lineColors);
			var lineWidths = opt.lineWidths;
			var valueToY = function() { return height - (yQuotient * (value - min)); };
			var fill = opt.fill;//Don't convert this to a function since there's only one possible fill


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
				if(fill && values.length === 1) {
					//Trace path for fill (and save point coordinates for the line afterwards)
					context.beginPath();
					value = 0;
					context.moveTo(left + xQuotient / 4 + pointSizes[0], valueToY());
					for(i = 0; i < coords.length; i++) { context.lineTo(coords[i].x, coords[i].y); }
					value = 0;
					context.lineTo(fullWidth - pointSizes[0] - xQuotient / 4, valueToY());
					context.fillStyle = fill;
					context.fill();
				}
				allCoords.push(coords);
			}

			Drawers.drawYAxis(context, gridlines.widths[0], gridlines.widths[1], gridlines.colors[0], gridlines.colors[1], yAxis.color, yAxis.size, yAxis.formatter, left, fullWidth, height, yQuotient, min, max, region, 0);

			for(j = 0; j < values.length; j += 1) {
				coords = allCoords[j];
				lineColors[j] = lineColors.call(self, values[j][i], j, values[j]);
				for(i = 0; i < coords.length; i++) Drawers.circle(context, coords[i].x, coords[i].y, pointSizes[j % pointSizes.length], 0, 2 * Math.PI, lineColors[j]);
				Drawers.line(context, coords, lineColors[j], lineWidths[j % lineWidths.length]);
			}

			//Draw x-axis
			if(levels) { Drawers.drawXAxis(context, xAxis.color, xAxis.size, height, allCoords[0], labels); }

			//Draw focus around hovered rectangle and write value

			if(focus && hoverPos) {
				hoverPos = JSON.parse(hoverPos);

				//Loop through values again
				for(i = 0; i < allCoords[0].length; i++) {
					var box = allCoords[0][i];
					//Check if mouse is within the point's double space
					if(hoverPos.x >= box.x - xQuotient / 3 && hoverPos.x <= box.x + xQuotient / 3) {
						Drawers.tooltip(context, hoverPos.x, hoverPos.y, values.map(Helpers.extractor(i)), lineColors, tooltip.size, tooltip.color, tooltip.formatter);
						break;//Don't analyze other values
					}
				}
			}

			if(focus) { addEvents(canvas); }
		}
	);

	//Bar chart
	peity.register("bar", {
		fill: [["#48f"], ["#f90"], ["#99f"]],
		delimiters: ["|", ","],
		height: 16, width: 32, left: 0, gap: 1, seriesGap : 0,
		max: null, min: 0,
		xAxis: Helpers.defaultText, yAxis: Helpers.defaultText, tooltip: Helpers.defaultText,
		focus: { color: "#000", width: 0 },
		gridlines: { widths: [1, 0], colors: ["#000", "#bbb"] }
	},
		function(opt) {
			//Declare variables
			var self = this;

			//Find minimum and maximum in values to determine range
			var values = self.values.apply(self, opt.delimiters);
			var seriesNum = values.length;
			var allValues = [].concat.apply([opt.max, opt.min], values);
			var value, i, j;

			//Identify labels and height needed to display them
			var labels = opt.labels;
			var levels = 0;
			if(labels) {
				labels = Helpers.stringifier(labels);
				levels = Helpers.labelLeveler(labels);
			}

			//Find range of values
			var max = Math.max.apply(Math, allValues);
			var min = Math.min.apply(Math, allValues);
			var region = opt.region || ((max - min) / 5);
			max = Math.ceil(max / region) * region;
			min = Math.floor(min / region) * region;

			//Formatting options
			var fill = Helpers.toFunction(opt.fill);
			var yAxis = opt.yAxis;
			var xAxis = opt.xAxis;
			var focus = opt.focus;
			var tooltip = opt.tooltip;
			var gridlines = opt.gridlines;

			//Prepare canvas
			var hoverPos = self.$el.data("mouse");
			var canvas = self.prepareCanvas(opt.width, opt.height);
			var context = self.context;

			//Size
			var fullWidth = canvas.width;
			var fullHeight = canvas.height;
			var gap = opt.gap;
			var seriesGap = opt.seriesGap;
			var left = opt.left;
			var bottom = levels * xAxis.size + (levels ? 4 : 0);
			var width = fullWidth - left;
			var height = fullHeight - bottom - gridlines.widths[0];


			//Value to Pixel conversion
			var yQuotient = height / (max - min);
			var xQuotient = (width - (gap * values[0].length)) / values[0].length;

			var valueToY = function() { return height - (yQuotient * (value - min)); };

			//Draw baseline and yAxis gridlines
			Drawers.drawYAxis(context, gridlines.widths[0], gridlines.widths[1], gridlines.colors[0], gridlines.colors[1], yAxis.color, yAxis.size, yAxis.formatter, left, fullWidth, height, yQuotient, min, max, region, 0);

			//Loop through values and draw each bar
			var boxes, series, box, firstBoxes, allBoxes = [], midpoints = [];
			for(i = 0; i < values.length; i++) {
				series = values[i];
				
				boxes = [];
				for(j = 0; j < values[i].length; j++) {
					midpoints[j] = { x: left + gap / 2 + j * (gap + xQuotient) + xQuotient / 2 };
					value = series[j];
					box = [
						//left margin + group*groupWidth + groupWidth/#series*series + groupMargin
						left + gap/2 + j * (gap + xQuotient) + xQuotient / seriesNum * i,//x
						valueToY(),//y
						//groupWidth/#series
						xQuotient / seriesNum - seriesGap/2,//w
						value === 0 ? 1 : yQuotient * value//h
					];
					boxes.push(box);

					//Draw the bar
					Drawers.rect(context, box[0], box[1], box[2], box[3], fill[i % fill.length].call(self, value, j, values[i]), 0);
				}
				if(i === 0) firstBoxes = boxes.slice(0);
				allBoxes.push(boxes.slice(0));
			}
			
			//Draw x-axis
			if(levels) { Drawers.drawXAxis(context, xAxis.color, xAxis.size, height, midpoints, labels); }

			//Draw focus around hovered rectangle and write value
			if(focus.width && hoverPos) {
				hoverPos = JSON.parse(hoverPos);

				//Loop through values again
				for(i = 0; i < allBoxes[0].length; i++) {
					var box = allBoxes[0][i];
					//Check if mouse is within this group's horizontal space
					if(hoverPos.x >= box[0] && hoverPos.x <= box[0] + xQuotient) {
						//If mouse is within a bar, draw a focus
						for(j = 0; j < allBoxes.length; j++) {
							Drawers.rect(context, allBoxes[j][i][0] - focus.width / 2, allBoxes[j][i][1] - focus.width / 2, allBoxes[j][i][2] + focus.width, allBoxes[j][i][3] + focus.width, undefined, focus.width, focus.color);
						}
						Drawers.tooltip(context, hoverPos.x, hoverPos.y, values.map(Helpers.extractor(i)), values.map(function(e, k) {
							return fill[k].call(self, e[i], i, e); }
						), tooltip.size, tooltip.color, tooltip.formatter);
						break;//Don't analyze other values
					}
				}
			}

			if(focus.width) { addEvents(canvas); }
		}
	);
})(jQuery, Math);