var http = require('http')
  , queue = require('queue-async')
  , app = require('./app')
  , server = http.createServer(app)
  , Chart = require('./chart')

server.listen(0, function() {
  Chart.port(server.address().port)

  var q = queue(4)

  Chart.all().forEach(function(chart) {
    q.defer(function(callback) {
      process.stdout.write('.')
      chart.screenshot(chart.fixturePath, callback)
    })
  })

  q.awaitAll(function(err) {
    if (err) throw err
    server.close()
    process.stdout.write("\n")
  })
})
