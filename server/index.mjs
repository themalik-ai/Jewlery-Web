import app from './app.mjs'

const port = Number(process.env.PORT || 8787)

app.listen(port, '0.0.0.0', () => {
  console.log(`SCARLET API listening on http://0.0.0.0:${port}`)
  console.log('Payments: offline methods only; no live gateway configured.')
})
