import blockhash from 'blockhash-core'

import {EmoteData, EmoteProvider} from './emote-index'
import {bttvEmoteImage, ffzEmoteImage} from './variables'

const pHashPromises: Map<EmoteData, Promise<string>> = new Map()
const pHashCache: Record<string, string> = JSON.parse(localStorage.getItem('perceptualHashCache') ?? '{}')

const HASH_LENGTH = 10

export function perceptualHash(emote: EmoteData) {
  if (emote.id in pHashCache) return Promise.resolve(pHashCache[emote.id])
  if (!pHashPromises.has(emote)) {
    let imageUrl
    if (emote.provider === EmoteProvider.BTTV) imageUrl = bttvEmoteImage(emote.id)
    else if (emote.provider === EmoteProvider.FFZ) imageUrl = ffzEmoteImage(emote.id, emote.animated)
    else throw new Error('Invalid emote provider')
    const image = new Image();
    image.src = imageUrl
    image.crossOrigin = 'anonymous'
    image.style.display = 'none'
    document.body.append(image)
    image.id = emote.id

    let resolve: (value: string) => void
    pHashPromises.set(emote, new Promise<string>(res => resolve = res))
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.height = canvas.width = 112
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Unknown error while reading image data')
      context.drawImage(image, 0, 0)

      const imageData = context.getImageData(0, 0, 112, 112);
      const hexHash = blockhash.bmvbhash(imageData, HASH_LENGTH);
      const binHash = (parseInt(hexHash, 16).toString(2)).padStart(HASH_LENGTH ** 2, '0');
      resolve(binHash)
      pHashCache[emote.id] = binHash
      localStorage.setItem('perceptualHashCache', JSON.stringify(pHashCache))
    }

  }
  return pHashPromises.get(emote) as Promise<string>
}

function toDataURL(url: string) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('get', url);
    xhr.responseType = 'blob';
    xhr.onload = function () {
      const fr = new FileReader();

      fr.onload = function () {
        resolve(this.result);
      };

      fr.readAsDataURL(xhr.response);
    };

    xhr.send();
  })
}
