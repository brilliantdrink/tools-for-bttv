import {bttvOrigin, ffzOrigin} from '../variables'

function makeIFrame() {
  return new Promise<HTMLIFrameElement>((resolve, reject) => {
    const iframe = document.createElement('iframe')
    let url: URL = null!
    if (location.host === bttvOrigin) {
      url = new URL('https://' + ffzOrigin)
    } else if (location.host === ffzOrigin) {
      url = new URL('https://' + bttvOrigin)
    } else return reject()
    url.pathname = '/induce404'
    iframe.src = url.toString()
    iframe.style.visibility = 'hidden'
    iframe.style.position = 'absolute'
    iframe.style.pointerEvents = 'none'
    document.body.appendChild(iframe)
    iframe.onload = () => resolve(iframe)
  })
}

// remove: bttv disallows iframes

export function sendToProviders(message: any) {
  return new Promise<any>((resolve) => {
    makeIFrame().then(iframe => {
      console.log(iframe)
      const messageId = crypto.randomUUID()
      const host = 'https://' + (location.host === bttvOrigin ? ffzOrigin : bttvOrigin)

      function messageHandler(event: MessageEvent) {
        console.log('parent', event)
        if (event.origin !== host) return
        if (event.data.id !== messageId) return
        iframe.contentWindow?.removeEventListener('message', messageHandler)
        resolve(event.data.message)
        iframe.remove()
      }

      iframe.contentWindow?.addEventListener('message', messageHandler)
      console.log(message, host, messageId)
      iframe.contentWindow?.postMessage({id: messageId, message}, host)
    })
  })
}

addEventListener('message', event => {
  console.log('iframe', event)
  const host = 'https://' + (location.host === bttvOrigin ? ffzOrigin : bttvOrigin)
  if (event.origin !== host) return
  if (!('id' in event.data && 'message' in event.data)) return
  const messageId = event.data.id
  const message = event.data.message
  if ('tfb-twitch_code' in message) {
    if (message['tfb-twitch_code'] === null) {
      postMessage({id: messageId, message: {'tfb-twitch_code': localStorage.getItem('tfb-twitch_code')}}, host)
    } else if (typeof message['tfb-twitch_code'] === 'string') {
      localStorage.setItem('tfb-twitch_code', message['tfb-twitch_code'])
      postMessage({id: messageId, message: 'ok'}, host)
    }
  }
})
