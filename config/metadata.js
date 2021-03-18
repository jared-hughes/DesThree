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
  require: [],
  supportURL: 'https://github.com/jared-hughes/DesThree/issues',
  downloadURL: 'https://github.com/jared-hughes/DesThree/releases/latest/download/DesThree.user.js',
  updateURL: 'https://github.com/jared-hughes/DesThree/releases/latest/download/DesThree.user.js',
  grant: [
    'none'
  ],
  'run-at': 'document-idle'
}
