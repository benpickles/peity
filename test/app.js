var express = require('express')
  , Chart = require('./chart')

var sendfile = function(filename, root) {
  return function(_, res) {
    res.sendFile(filename, { root: root })
  }
}

var jquery = sendfile('/jquery-1.6.2.min.js', __dirname)
  , peity = sendfile('/jquery.peity.js', __dirname + '/..')
  , style = sendfile('/style.css', __dirname)

var index = function(_, res) {
  res.render('index', {
    charts: Chart.all()
  })
}

var show = function(req, res) {
  var id = req.params.id
    , chart = Chart.find(id)

  if (chart) {
    res.render('show', {
      chart: chart
    })
  } else {
    res
      .status(404)
      .end()
  }
}

var app = express()
  .set('view engine', 'ejs')
  .set('views', __dirname + '/views')
  .get('/jquery.min.js', jquery)
  .get('/jquery.peity.js', peity)
  .get('/style.css', style)
  .get('/', index)
  .get('/:id', show)

module.exports = app
