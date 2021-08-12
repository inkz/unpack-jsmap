import { URL } from 'url'
import fetch, { Response } from 'node-fetch'

type ResponseFormat = 'json' | 'text'
type UnpackSettings = {
  scriptContent?: string,
  forceFetch?: boolean
}

async function request (url: URL, format: ResponseFormat): Promise<any> {
  const res: Response = await fetch(url.toString(), { timeout: 1000 })
  if (format === 'json') {
    return await res.json()
  }
  return await res.text()
}

export async function fetchMap (sourceMapUrl: URL | string): Promise<any> {
  const sourceMapUrlObj = typeof sourceMapUrl === 'string' ? new URL(sourceMapUrl) : sourceMapUrl
  const map: any = await request(sourceMapUrlObj, 'json')
  const result: any = {}
  for (let i = 0; i < map.sources.length; i++) {
    const content = map.sourcesContent && map.sourcesContent[i]
    if (map.sources[i] && content) {
      result[map.sources[i]] = content
    }
  }
  return result
}

function getSourceMapUrl (scriptUrl: URL, scriptContent: string): URL {
  const match: RegExpMatchArray = String(scriptContent).match(/\/\/#\s*sourceMappingURL=(.*)$/m) || []
  const sourceMapUrl: string = match[1]
  if (!sourceMapUrl) {
    throw new Error('source map url not found')
  }
  try {
    return new URL(sourceMapUrl)
  } catch (err) {
    const { origin, pathname } = scriptUrl
    const parts = pathname.split('/')
    parts[parts.length - 1] = sourceMapUrl
    return new URL(parts.join('/'), origin)
  }
}

export async function unpack (scriptUrl: URL | string, settings?: UnpackSettings) : Promise<any> {
  if (!scriptUrl) {
    throw new Error('script url is missing')
  }
  const scriptUrlObj = typeof scriptUrl === 'string' ? new URL(scriptUrl) : scriptUrl
  settings = settings || {}
  let { scriptContent, forceFetch } = settings

  if (!scriptContent) {
    scriptContent = await request(scriptUrlObj, 'text')
  }

  if (!scriptContent) {
    throw new Error('unable to fetch script')
  }

  try {
    const sourceMapUrl = getSourceMapUrl(scriptUrlObj, scriptContent)
    return await fetchMap(sourceMapUrl)
  } catch (err) {
    if (forceFetch) {
      return await fetchMap(new URL(scriptUrlObj.origin + scriptUrlObj.pathname + '.map'))
    } else {
      throw err
    }
  }
}

export default unpack
