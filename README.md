# unpack-jsmap

Library for recovering files from Webpack sourcemaps (`.js.map`).

# Install

```bash
npm i unpack-jsmap
```

# Usage

```javascript
const { unpack } = require('unpack-jsmap')

unpack('https://www.example.com/test.js').then(map => console.log(map))
```

# API

### unpackJsmap.unpack(url [, settings]): Promise<{fileName: fileContent}>

* `url` - valid URL string or URL object
* `settings` - (optional) settings object:
  - `scriptContent` - string
  - `forceFetch` - boolean

### unpackJsmap.fetchMap(url): Promise<{fileName: fileContent}>

* `url` - valid URL string or URL object
