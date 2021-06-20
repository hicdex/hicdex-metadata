import fetch from 'node-fetch'
import { readMetadata, writeMetadata } from './utils.js'

async function fetchMetadata (tokenId) {
  const resp = await fetch(`https://api.better-call.dev/v1/tokens/mainnet/metadata?contract:KT1Hkg5qeNhfwpKW4fXvq7HGZB9z2EnmCCA9&token_id=${tokenId}`)
  const data = await resp.json()
  return data.find(({ symbol, contract }) => symbol === 'OBJKT' && contract === 'KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton')
}

function needsFixing (obj) {
  if (!Array.isArray(obj.tags) || !obj.tags.length) {
    return true
  }
  if (!Array.isArray(obj.creators) || !obj.creators.length) {
    return true
  }
  return false
}

function applyFix (obj, metadata) {
  let fixed = false
  if (Array.isArray(metadata.tags)) {
    obj.tags = metadata.tags.filter((tag) => tag)
    fixed = true
  }
  if (Array.isArray(metadata.creators)) {
    obj.creators = metadata.creators
    fixed = true
  }
  return fixed
}

async function fix () {
  for (let tokenId = 152; tokenId < 142600; tokenId++) {
    try {
      const obj = readMetadata(tokenId)
      if (obj.__failed_attempt) {
        console.warn({ failed: tokenId })
        continue
      }

      if (needsFixing(obj)) {
        const metadata = await fetchMetadata(tokenId)
        console.log(`fetched ${tokenId}`)

        if (metadata && metadata.token_id === obj.token_id && metadata.artifact_uri === obj.artifact_uri) {
          const fixed = applyFix(obj, metadata)
          if (fixed) {
            console.log(`fixed ${tokenId}`)
            writeMetadata(tokenId, obj)
          }
        }
        else {
          console.error(obj)
          console.error(metadata)
          break
        }
      }
    }
    catch (err) {
      console.log(`not processed: ${tokenId}`)
      console.error(err)
    }
  }
}

fix()
