const app = require('./app')
const port = process.env.PORT || 8080

app.listen(port, function () {
  console.log('Listening on port %d', port)
})
