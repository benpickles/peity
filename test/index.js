var http = require('http')
  , mocha = require('mocha')
  , queue = require('queue-async')
  , app = require('./app')
  , server = http.createServer(app)
  , Chart = require('./chart')
  , assert = require('assert')

describe('Peity', function() {
  before(function(done) {
    server.listen(0, function() {
      Chart.port(server.address().port)
      done()
    })
  })

  after(function() {
    server.close()
  })

  Chart.forEach(function(chart) {
    it(chart.id, function(done) {
      queue(1)
        .defer(chart.screenshot.bind(chart), chart.imagePath)
        .defer(chart.compare.bind(chart))
        .await(function(err, _, difference) {
          if (err) throw err
          assert.strictEqual(difference, 0)
          done()
        })
    })
  })
})
