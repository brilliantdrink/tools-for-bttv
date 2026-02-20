import {render} from 'solid-js/web'
import debounce from 'lodash.debounce'
import {queryFutureElement} from '../util/future-element'
import {EmoteProvider} from '../util/emote-context'
import {EmoteWidget} from '../emote-widget/emote-widget'
import {CurrentChannelProvider} from '../util/track-current-channel'
import error, {ErrorType} from '../util/error'
import {AttachmentPoints} from '../variables'

export default async function initBttvEmote() {
  const currentUrl = location.pathname
  let column: HTMLDivElement = await queryFutureElement('[class*=_column]')
  const root = document.createElement('div')

  const bttvFirstEmotePanel = await queryFutureElement('[class*=_panel]') as HTMLDivElement
  const bttvPanelClass = bttvFirstEmotePanel.classList.toString()
  const bttvEmoteName = (bttvFirstEmotePanel.querySelector('[class*=_section] > p') as HTMLParagraphElement | null)?.innerText.trim()
  const bttvEmoteId = location.pathname.match(/^\/emotes\/([0-9a-f]+)(\/.)?$/)?.[1]
  if (!bttvEmoteName || !bttvEmoteId) {
    error({
      type: ErrorType.Initialisation,
      provider: EmoteProvider.BTTV,
      attachment: AttachmentPoints.BttvEmote,
      message: <span>Something went wrong initializing <i>Tools for BTTV</i></span>,
      detail: `Either emote id or code not found: found id: "${bttvEmoteId}", found name: "${bttvEmoteName}"`,
    })
    return
  }
  const bttvSectionClass = bttvFirstEmotePanel.querySelector('[class*=_section]')?.classList.toString()
  const bttvSectionClassName = Array.from(bttvFirstEmotePanel.querySelector('[class*=_section]')?.classList ?? [])
    .find(name => name.includes('_section'))
  if (!bttvSectionClass || !bttvSectionClassName) {
    const el = bttvFirstEmotePanel.querySelector('[class*=_section]')
    error({
      type: ErrorType.Initialisation,
      provider: EmoteProvider.BTTV,
      attachment: AttachmentPoints.BttvEmote,
      message: <span>Something went wrong initializing <i>Tools for BTTV</i></span>,
      detail: `Either section element or section class not found: class list: element: ${!!el}, full class: "${bttvSectionClass}", class name: "${bttvSectionClassName}"`,
    })
    return
  }
  let detach: () => void = () => 0
  const reattach = debounce(async () => {
    detach()
    column = await queryFutureElement('[class*=_column]')
    const halfWidth = column.parentElement?.getAttribute('colums' /* sic !!! */) === '2'
    let actionsPanel = Array.from(column.children).toSpliced(0, 1)
      .find(element => element.textContent?.startsWith('Actions'))
    ;(actionsPanel ?? column.children[0]).insertAdjacentElement('afterend', root)
    const bttvAppData = {
      emoteName: bttvEmoteName, emoteId: bttvEmoteId, panelClass: bttvPanelClass,
      sectionClass: bttvSectionClass, sectionClassName: bttvSectionClassName, halfWidth,
    }
    detach = render(
      () => (
        <CurrentChannelProvider provider={EmoteProvider.BTTV}>
          <EmoteWidget provider={EmoteProvider.BTTV} data={bttvAppData} />
        </CurrentChannelProvider>
      ),
      root
    )
  }, 300, {leading: false, trailing: true})
  await reattach()
  const observer = new MutationObserver(() => {
    if (currentUrl !== location.pathname) {
      observer.disconnect()
      detach()
      return
    }
    if (root.isConnected) return
    reattach()
  })
  const columnParent = column.parentElement?.parentElement
  if (columnParent) {
    observer.observe(columnParent, {childList: true, subtree: true})
  }
  return () => {
    observer.disconnect()
    detach()
  }
}
