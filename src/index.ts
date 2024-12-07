import {bttvOrigin, ffzOrigin} from './variables'
import {attachBTTV} from './bttv'
import {attachFFZ} from './ffz'

var styles = document.createElement('link')
styles.rel = 'stylesheet'
styles.href = 'https://cdn.jsdelivr.net/gh/brilliantdrink/tools-for-bttv/tools-for-bttv.css'
document.head.appendChild(styles)

function attach() {
  if (location.host === bttvOrigin) {
    attachBTTV()
  } else if (location.host === ffzOrigin) {
    attachFFZ()
  }
}

attach()
