const fs = require('fs')
const path = require('path')

const args = process.argv.slice(2)
const dest = args.pop()
for (const filePath of args) {
  const p = path.resolve(filePath)
  const d = path.join(dest, path.basename(p))
  console.log('copying file:', p, 'to', d)
  fs.writeFileSync(d, fs.readFileSync(p))
}
