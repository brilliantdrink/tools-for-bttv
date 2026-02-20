import {render} from 'solid-js/web'
import {queryFutureElement} from '../util/future-element'
import {EmoteProvider} from '../util/emote-context'
import {CurrentChannelProvider} from '../util/track-current-channel'
import {EmoteSetWidget} from '../emote-set-widget'

export default async function initBttvDashSet() {
  const root = document.createElement('div')
  let parent = await queryFutureElement('.css-13xhnxm .css-fqllj7') as HTMLDivElement
  parent.appendChild(root)
  const observer = new MutationObserver(async () => {
    if (root.isConnected) return
    parent = await queryFutureElement('.css-13xhnxm .css-fqllj7') as HTMLDivElement
    parent.appendChild(root)
  })
  observer.observe(document.body, {childList: true, subtree: true})

  parent.style.gap = '.5rem'
  const setName = (parent.querySelector('.css-xl71ch') as null | HTMLDivElement)?.innerText?.replace(/\(\d+ ?\/ ?\d+\)/, '')?.trim()
  const setId = location.pathname.match(/^\/dashboard\/emotes\/([0-9a-f]+)(\/.)?$/)?.[1]
  const detachWidget = render(
    () => (
      <CurrentChannelProvider provider={EmoteProvider.BTTV}>
        <EmoteSetWidget provider={EmoteProvider.BTTV} set={{name: setName ?? '', id: setId ?? ''}} />
      </CurrentChannelProvider>
    ),
    root
  )

  return () => {
    detachWidget()
  }
}
