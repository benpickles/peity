const http = require('http')
const { JSDOM } = require('jsdom')

const app = require('./app')
const server = http.createServer(app)
const charts = require('./charts.json')

let serverUrl
const chartUrl = id => [serverUrl, id].join('/')

beforeAll(async () => {
  await server.listen(0)
  const { port } = server.address()
  serverUrl = `http://localhost:${port}`
})

afterAll(async () => server.close())

Object.keys(charts).forEach(id => {
  test(`renders test chart ${id} correctly`, async () => {
    await page.goto(chartUrl(id))

    const html = await page.evaluate(
      id => document.querySelector(`.chart-${id}`).innerHTML,
      id
    )

    // Pass through JSDOM for prettier snapshots.
    const dom = new JSDOM(html.trim())
    expect(dom.window.document.body).toMatchSnapshot()
  })
})
