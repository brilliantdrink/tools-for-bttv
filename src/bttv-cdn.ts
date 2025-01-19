import {perceptualHash} from './perceptual-hash'
import {bttvOrigin} from './variables'

export function attachBTTVCdn() {
  if (!window.top) return
  window.onmessage = (e) => {
    if (!window.top) return
    if (typeof e.data !== 'object') return
    if (e.data.type === 'ping') {
      window.top.postMessage({type: 'pong'}, 'https://' + bttvOrigin)
    } else if (e.data.type === 'emote') {
      perceptualHash(e.data.emote).then(phash => {
        window.top?.postMessage({
          type: 'phash',
          id: e.data.id,
          phash
        }, 'https://' + bttvOrigin)
      })
    }
  };
}
