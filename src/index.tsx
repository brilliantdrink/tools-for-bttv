import './hook-fetch'
import {
  AttachmentPoints,
  bttvDashPath,
  bttvOrigin,
  ffzDashPath,
  ffzOrigin,
  isBttvEmotePath,
  isFfzEmotePath
} from './variables'
import initBttvDash from './init/bttv-dash'
import initBttvEmote from './init/bttv-emote'
import initFfzDash from './init/ffz-dash'
import initFfzEmote from './init/ffz-emote'
import {bttvDashPerfTweaks} from './bttv-dash-perf-tweaks'

import './variables.scss'

if (DIST == 'userscript') {
  const styles = document.createElement('link')
  styles.rel = 'stylesheet'
  const styleLink = (fallback = false) => {
    if (ENV !== 'development') return 'https://cdn.jsdelivr.net/gh/brilliantdrink/tools-for-bttv/tools-for-bttv.css'
    const url = new URL(!fallback ? 'https://127.0.0.1:8081' : 'https://localhost:8081')
    url.pathname = '/tools-for-bttv.css'
    return url.toString()
  }
  styles.href = styleLink()
  styles.onerror = () => styles.href = styleLink(true)
  document.head.appendChild(styles)
}

function findAttachmentPoint() {
  if (location.host === bttvOrigin) {
    if (location.pathname.includes(bttvDashPath)) return AttachmentPoints.BttvDash
    if (isBttvEmotePath(location.pathname)) return AttachmentPoints.BttvEmote
  } else if (location.host === ffzOrigin) {
    if (location.pathname.includes(ffzDashPath)) return AttachmentPoints.FfzDash
    if (isFfzEmotePath(location.pathname)) return AttachmentPoints.FfzEmote
  }
  return null
}

function observeLocation(callback: (attachmentPoint: AttachmentPoints | null) => void) {
  let last = location.pathname
  let attachmentPoint = findAttachmentPoint()
  callback(attachmentPoint)
  setInterval(() => {
    if (location.pathname === last) return
    last = location.pathname
    const newAttachmentPoint = findAttachmentPoint()
    if (newAttachmentPoint === attachmentPoint) return
    attachmentPoint = newAttachmentPoint
    callback(newAttachmentPoint)
  }, 50)
}

let detach: () => void = () => 0

const ATTACH_DELAY = 700

window.addEventListener('load', () => {
  observeLocation(async (attachmentPoint) => {
    detach()
    switch (attachmentPoint) {
      case AttachmentPoints.BttvDash:
        detach = await initBttvDash(ATTACH_DELAY)
        await bttvDashPerfTweaks()
        break
      case AttachmentPoints.BttvEmote:
        detach = await initBttvEmote().catch(console.error) ?? detach
        break
      case AttachmentPoints.FfzDash:
        detach = await initFfzDash()
        break
      case AttachmentPoints.FfzEmote:
        detach = await initFfzEmote() ?? detach
        break
    }
  })
})
