import fs from 'fs'

function path (tokenId) {
  const lvl2 = tokenId % 10
  const lvl1 = (tokenId % 100 - lvl2) / 10
  return `./tokens/${lvl1}/${lvl2}/${tokenId}.json`
}

export function readMetadata (tokenId) {
  const file = fs.readFileSync(path(tokenId))
  const obj = JSON.parse(file.toString())
  return obj
}

export function writeMetadata (tokenId, obj) {
  fs.writeFileSync(path(tokenId), JSON.stringify(obj))
}
