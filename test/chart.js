var child_process = require('child_process')
  , charts = require('./charts.json')
  , screenshot = __dirname + '/bin/screenshot'
  , port

var fixturePath = function(id) {
  return __dirname + '/fixtures/' + id + '.png'
}

var Chart = function(id) {
  this.id = id

  var obj = charts[id]

  this.height = obj.height
  this.opts = obj.opts
  this.text = obj.text
  this.type = obj.type
  this.width = obj.width

  this.fixturePath = fixturePath(id)
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

Chart.prototype.screenshot = function(callback) {
  child_process.execFile(screenshot, [
    this.url(),
    this.fixturePath,
    this.width,
    this.height
  ], callback)
}

Chart.prototype.url = function() {
  return 'http://localhost:' + port + '/charts/' + this.id
}

exports.find = function(id) {
  return charts[id] ? new Chart(id) : null
}

exports.forEach = function(callback) {
  return Object.keys(charts).forEach(function(id) {
    callback(new Chart(id))
  })
}

exports.port = function(number) {
  port = number
}
