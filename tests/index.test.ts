import * as test from 'tape'
import * as nock from 'nock'
import { URL } from 'url'
import { fetchMap, unpack } from '../src/index'

test('fetchMap: schould fetch .js.map from provided URL', async (t) => {
  const jsMapUrl = new URL('https://www.example.com/example.js.map')
  const jsMapContent = {
    sources: ['../test-module'],
    sourcesContent: ['console.log(123)']
  }
  nock(jsMapUrl.origin).get(jsMapUrl.pathname).reply(200, jsMapContent)

  const map = await fetchMap(jsMapUrl)
  t.deepEqual(map, {
    '../test-module': 'console.log(123)'
  })
  t.end()
})

test('fetchMap: schould throw error if .js.map does not have correct structure', async (t) => {
  const jsMapUrl = new URL('https://www.example.com/example.js.map')
  const jsMapContent = {
    foo: 'bar'
  }
  nock(jsMapUrl.origin).get(jsMapUrl.pathname).reply(200, jsMapContent)

  let error
  try {
    await fetchMap(jsMapUrl)
  } catch (err) {
    error = err.message
  }
  t.equal(error, "Cannot read property 'length' of undefined")
  t.end()
})

test('fetchMap: schould return empty object for empty map', async (t) => {
  const jsMapUrl = new URL('https://www.example.com/example.js.map')
  const jsMapContent = {
    sources: [''],
    sourcesContent: ['']
  }
  nock(jsMapUrl.origin).get(jsMapUrl.pathname).reply(200, jsMapContent)

  const map = await fetchMap(jsMapUrl)
  t.deepEqual(map, {})
  t.end()
})

test('unpack: schould fetch .js.map from provided script URL', async (t) => {
  const jsUrl = new URL('https://www.example.com/example.js')
  const script = `
    console.log(123);
    //# sourceMappingURL=example.js.map
  `
  nock(jsUrl.origin).get(jsUrl.pathname).reply(200, script)
  nock(jsUrl.origin).get('/example.js.map').reply(200, {
    sources: ['../test-module'],
    sourcesContent: ['console.log(123)']
  })

  const map = await unpack(jsUrl)
  t.deepEqual(map, {
    '../test-module': 'console.log(123)'
  })
  t.end()
})

test('unpack: schould fetch .js.map from provided script URL and script content', async (t) => {
  const jsUrl = new URL('https://www.example.com/example.js')
  const scriptContent = `
    console.log(123);
    //# sourceMappingURL=example.js.map
  `
  nock(jsUrl.origin).get('/example.js.map').reply(200, {
    sources: ['../test-module'],
    sourcesContent: ['console.log(123)']
  })

  const map = await unpack(jsUrl, { scriptContent })
  t.deepEqual(map, {
    '../test-module': 'console.log(123)'
  })
  t.end()
})

test('unpack: schould fetch .js.map from provided script URL and forceFetch = true', async (t) => {
  const jsUrl = new URL('https://www.example.com/example.js')
  const script = `
    console.log(123);
  `
  nock(jsUrl.origin).get(jsUrl.pathname).reply(200, script)
  nock(jsUrl.origin).get('/example.js.map').reply(200, {
    sources: ['../test-module'],
    sourcesContent: ['console.log(123)']
  })

  const map = await unpack(jsUrl, { forceFetch: true })
  t.deepEqual(map, {
    '../test-module': 'console.log(123)'
  })
  t.end()
})

test('unpack: schould fail if no .js.map found', async (t) => {
  const jsUrl = new URL('https://www.example.com/example.js')
  const script = `
    console.log(123);
  `
  nock(jsUrl.origin).get(jsUrl.pathname).reply(200, script)

  let error
  try {
    await unpack(jsUrl)
  } catch (err) {
    error = err.message
  }
  t.equal(error, 'source map url not found')
  t.end()
})

test('unpack: schould fail if no script content returned', async (t) => {
  const jsUrl = new URL('https://www.example.com/example.js')
  const script = ''
  nock(jsUrl.origin).get(jsUrl.pathname).reply(200, script)

  let error
  try {
    await unpack(jsUrl)
  } catch (err) {
    error = err.message
  }
  t.equal(error, 'unable to fetch script')
  t.end()
})

test('unpack: schould fail without provided URL', async (t) => {
  const nullValue: unknown = undefined
  let error
  try {
    await unpack(nullValue as URL)
  } catch (err) {
    error = err.message
  }
  t.equal(error, 'script url is missing')
  t.end()
})
