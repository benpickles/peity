const express = require('express')

const Chart = require('./chart')
const data = require('./charts.json')

const sendfile = (filename, root) => (_, res) =>
  res.sendFile(filename, { root })

const jquery = sendfile('/jquery-1.6.2.min.js', __dirname)
const peity = sendfile('/jquery.peity.js', __dirname + '/..')
const style = sendfile('/style.css', __dirname)

const index = function (_, res) {
  const charts = Object.keys(data).map(id => new Chart(id, data[id]))
  res.render('index', { charts })
}

const show = function (req, res) {
  const { id } = req.params
  const props = data[id]

  if (!props) return res.status(404).end()

  const chart = new Chart(id, props)
  res.render('show', { chart })
}

const app = express()
  .set('view engine', 'ejs')
  .set('views', __dirname + '/views')
  .get('/jquery.min.js', jquery)
  .get('/jquery.peity.js', peity)
  .get('/style.css', style)
  .get('/', index)
  .get('/:id', show)

module.exports = app
