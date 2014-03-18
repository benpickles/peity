var charts = require('./charts.json')

var Chart = function(id) {
  this.id = id

  var obj = charts[id]

  this.opts = obj.opts
  this.text = obj.text
  this.type = obj.type
}

Chart.prototype.optionsString = function() {
  switch(typeof this.opts) {
    case 'object':
      return JSON.stringify(this.opts)
    case 'string':
      return this.opts
    default:
      return '{}'
  }
}

exports.find = function(id) {
  return charts[id] ? new Chart(id) : null
}
