const fs = require('fs')

/*
This script normalizes and augments metadata files from bcd and ipfs into objkt metadata format v1.
*/

const mapper = {
  token_id: (_obj, tokenId) => tokenId,
  symbol: (obj) => obj.symbol || 'OBJKT',
  creators: (obj) => obj.creators || [],
  name: (obj) => obj.name || '',
  description: (obj) => obj.description || '',
  tags: (obj) => obj.tags || [],
  formats: (obj) => obj.formats || [],
  artifact_uri: (obj) => obj.artifact_uri || obj.artifactUri || '',
  display_uri: (obj) => obj.display_uri || obj.displayUri || '',
  thumbnail_uri: (obj) => obj.thumbnail_uri || obj.thumbnailUri || '',
}

function path(tokenId) {
  const lvl2 = tokenId % 10
  const lvl1 = (tokenId % 100 - lvl2) / 10
  return `./tokens/${lvl1}/${lvl2}/${tokenId}.json`
}

function readMetadata(tokenId) {
  const file = fs.readFileSync(path(tokenId))
  const obj = JSON.parse(file.toString())
  return obj
}

function readExtra(tokenId) {
  try {
    const file = fs.readFileSync(`./processed/${tokenId}.json`)
    const obj = JSON.parse(file.toString())
    return obj
  } catch (err) {
    // console.log(`no extra ${tokenId}`)
  }
  return []
}

function writeMetadata(tokenId, obj) {
  fs.writeFileSync(path(tokenId), JSON.stringify(obj))
}

function normalize(tokenId, obj) {
  const output = {
    __version: 1,
    extra: {}
  }
  Object.entries(mapper).forEach(([key, fn]) => {
    output[key] = fn(obj, tokenId)
  })
  return output
}

function augment(tokenId, obj) {
  if (obj.extra.display_uris) {
    return obj
  }
  obj.extra.display_uris = readExtra(tokenId)
  if (!obj.display_uri && obj.extra.display_uris.length) {
    const jpg1024 = obj.extra.display_uris.find(({ mimeType, file }) => mimeType === "image/jpeg" && file.endsWith("-1024.jpeg"))
    const jpg512 = obj.extra.display_uris.find(({ mimeType, file }) => mimeType === "image/jpeg" && file.endsWith("-512.jpeg"))
    if (jpg1024) {
      obj.display_uri = `ipfs://${jpg1024.cid}`
    } else if (jpg512) {
      obj.display_uri = `ipfs://${jpg512.cid}`
    }
  }
  return obj
}

for (let tokenId = 152; tokenId < 127000; tokenId++) {
  try {
    let obj = readMetadata(tokenId)
    if (obj.__failed_attempt) {
      console.warn({failed: tokenId})
      continue
    }

    obj = normalize(tokenId, obj)
    obj = augment(tokenId, obj)
    writeMetadata(tokenId, obj)

  } catch (err) {
    console.log(`not processed: ${tokenId}`)
    console.error(err)
  }
}
