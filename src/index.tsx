import {Match, render, Switch} from 'solid-js/web'
import debounce from 'lodash.debounce'
import {
  AttachmentPoints,
  bttvDashPath,
  bttvOrigin,
  ffzDashPath,
  ffzOrigin,
  isBttvEmotePath,
  isFfzEmotePath
} from './variables'
import {DashWidget} from './dash-widget/dash-widget'
import {queryFutureElement} from './util/future-element'
import {EmoteProvider} from './util/emote-context'
import {EmoteWidget, EmoteWidgetData} from './emote-widget/emote-widget'
import EmoteBadges from './dash-widget/emote-badges'

const styles = document.createElement('link')
styles.rel = 'stylesheet'
styles.href = (ENV === 'development' ? 'https://localhost:8080' : 'https://cdn.jsdelivr.net/gh/brilliantdrink/tools-for-bttv') + '/tools-for-bttv.css'
document.head.appendChild(styles)

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
const emoteIdFromLinkRegex = /emotes\/([^/]+)/

observeLocation(async (attachmentPoint) => {
  detach()
  switch (attachmentPoint) {
    case AttachmentPoints.BttvDash:
      const detachWidget = render(
        () => <App attachmentPoint={AttachmentPoints.BttvDash} />,
        await queryFutureElement('.chakra-tabs:has([role="tablist"])') as HTMLDivElement
      )
      let detachEmotes: (() => void)[] = []

      const attachBadges = debounce(async () => {
        detachEmotes.forEach(cb => cb())
        const emoteCards: HTMLAnchorElement[] = await queryFutureElement('[class*=emoteCard]')
          .then(() => Array.from(document.querySelectorAll('[class*=emoteCard_]')))
        const currentEmoteIds = emoteCards.map(el => el.href.match(emoteIdFromLinkRegex)?.[1] ?? '')
        const groupedEmoteIds: string[][] = []
        for (const emoteId of currentEmoteIds) {
          let ids = groupedEmoteIds.at(-1)
          if (!ids || ids.length === 50) {
            ids = []
            groupedEmoteIds.push(ids)
          }
          ids.push(emoteId)
        }
        detachEmotes = emoteCards.map(el => render(() => {
          const emoteId = el.href.match(emoteIdFromLinkRegex)?.[1] ?? ''
          const emoteIds = groupedEmoteIds.find(group => group.includes(emoteId)) as string []
          return <EmoteBadges emoteId={emoteId} emoteIds={emoteIds} provider={EmoteProvider.BTTV} />
        }, el))
      }, 500, {leading: false, trailing: true})
      attachBadges()

      const observer = new MutationObserver(attachBadges)
      observer.observe(
        await queryFutureElement('[id*=menu-button]:has(img)') as HTMLElement,
        {childList: true, subtree: true}
      )
      detach = () => {
        detachWidget()
        detachEmotes.forEach(cb => cb())
      }
      break
    case AttachmentPoints.BttvEmote:
      const column = await queryFutureElement('[class*=_column]') as HTMLDivElement
      const halfWidth = column.parentElement?.getAttribute('colums' /* sic !!! */) === '2'
      const root = document.createElement('div')
      if (column.children.length === 1) column.appendChild(root)
      else column.insertBefore(root, column.children[1])
      const bttvFirstEmotePanel = await queryFutureElement('[class*=_panel]') as HTMLDivElement
      const bttvPanelClass = bttvFirstEmotePanel.classList.toString()
      const bttvEmoteName = (bttvFirstEmotePanel.querySelector('[class*=_section] > p') as HTMLParagraphElement | null)?.innerText.trim()
      const bttvEmoteId = location.pathname.match(/^\/emotes\/([0-9a-f]+)(\/.)?$/)?.[1]
      if (!bttvEmoteName || !bttvEmoteId) break // todo: show error (and report to api)
      const bttvSectionClass = bttvFirstEmotePanel.querySelector('[class*=_section]')?.classList.toString()
      const bttvSectionClassName = Array.from(bttvFirstEmotePanel.querySelector('[class*=_section]')?.classList ?? [])
        .find(name => name.includes('_section'))
      if (!bttvSectionClass || !bttvSectionClassName) break // todo: show error (and report to api)
      const bttvAppData = {
        emoteName: bttvEmoteName, emoteId: bttvEmoteId, panelClass: bttvPanelClass,
        sectionClass: bttvSectionClass, sectionClassName: bttvSectionClassName, halfWidth,
      }
      detach = render(
        () => <App attachmentPoint={AttachmentPoints.BttvEmote} data={bttvAppData} />,
        root
      )
      break
    case AttachmentPoints.FfzDash:
      const ffzDashSidebar = await queryFutureElement('#sidebar') as HTMLDivElement
      detach = render(
        () => <App attachmentPoint={AttachmentPoints.FfzDash} />,
        ffzDashSidebar
      )
      break
    case AttachmentPoints.FfzEmote:
      const ffzEmoteSidebar = await queryFutureElement('#sidebar') as HTMLDivElement
      const ffzPanelClass = 'panel panel-default'
      const ffzEmoteName = location.pathname.match(/^\/emoticon\/([0-9]+)-(.+)$/)?.[2]
      const ffzEmoteId = location.pathname.match(/^\/emoticon\/([0-9]+)-(.+)$/)?.[1]
      if (!ffzEmoteName || !ffzEmoteId) break // todo: show error (and report to api)
      const ffzSectionClass = ''
      const ffzSectionClassName = ''
      const channelsAddPanel = Array.from(ffzEmoteSidebar.querySelectorAll('.panel')).find(el =>
        (el.querySelector('.panel-heading') as HTMLElement | null)?.innerText.toLowerCase() === 'Add to Channel'.toLowerCase()
      ) as HTMLElement | null
      const channelsRemovePanel = Array.from(ffzEmoteSidebar.querySelectorAll('.panel')).find(el =>
        (el.querySelector('.panel-heading') as HTMLElement | null)?.innerText.toLowerCase() === 'Remove from Channel'.toLowerCase()
      ) as HTMLElement | null
      const ffzEmotesChannelNames = Array.from((channelsAddPanel?.querySelectorAll('.list-group-item') ?? []))
        .concat(Array.from((channelsRemovePanel?.querySelectorAll('.list-group-item') ?? [])))
        .map(el => (el.childNodes.item(0) as Text).wholeText.trim())
      const ffzAppData = {
        emoteName: ffzEmoteName, emoteId: ffzEmoteId, panelClass: ffzPanelClass,
        channelNames: ffzEmotesChannelNames,
        sectionClass: ffzSectionClass, sectionClassName: ffzSectionClassName
      }
      detach = render(
        () => <App attachmentPoint={AttachmentPoints.FfzEmote} data={ffzAppData} />,
        ffzEmoteSidebar
      )
      break
  }
})

function App(props: { attachmentPoint: AttachmentPoints | null, data?: EmoteWidgetData }) {
  let provider: EmoteProvider | null = null
  if (props.attachmentPoint === AttachmentPoints.BttvDash || props.attachmentPoint === AttachmentPoints.BttvEmote)
    provider = EmoteProvider.BTTV
  else if (props.attachmentPoint === AttachmentPoints.FfzDash || props.attachmentPoint === AttachmentPoints.FfzEmote)
    provider = EmoteProvider.FFZ
  if (!provider) return null
  return (<>
    <Switch>
      <Match when={props.attachmentPoint === AttachmentPoints.BttvDash}>
        <DashWidget provider={provider} />
      </Match>
      <Match when={props.attachmentPoint === AttachmentPoints.BttvEmote}>
        {props.data && <EmoteWidget provider={provider} data={props.data} />}
      </Match>
      <Match when={props.attachmentPoint === AttachmentPoints.FfzDash}>
        <DashWidget provider={provider} />
      </Match>
      <Match when={props.attachmentPoint === AttachmentPoints.FfzEmote}>
        {props.data && <EmoteWidget provider={provider} data={props.data} />}
      </Match>
    </Switch>
  </>)
}
