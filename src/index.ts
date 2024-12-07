import {bttvOrigin, ffzOrigin} from './variables'
import {attachBTTV} from './bttv'
import {attachFFZ} from './ffz'

var styles = document.createElement('link')
styles.rel = 'stylesheet'
styles.href = 'https://127.0.0.1:8080/tools-for-bttv.css'
document.head.appendChild(styles)

function attach() {
  if (location.host === bttvOrigin) {
    attachBTTV()
  } else if (location.host === ffzOrigin) {
    attachFFZ()
  }
}

attach()