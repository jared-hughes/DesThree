const pkg = require('../package.json')

module.exports = {
  name: 'DesThree',
  namespace: 'http://github.com/jared-hughes',
  version: pkg.version,
  description: pkg.description,
  author: pkg.author,
  source: pkg.repository.url,
  match: [
    'https://www.desmos.com/calculator/*',
    'https://www.desmos.com/calculator'
  ],
  require: [
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r126/three.min.js'
  ],
  // TODO: downloadURL and updateURL
  grant: [
    'none'
  ],
  'run-at': 'document-idle'
}
