import {render} from 'solid-js/web'
import {EmoteProvider} from '../util/emote-context'
import {DuplicatesPanel} from '../panel/duplicates-panel'
import {EmoteWidget} from '../emote-widget/emote-widget'

export default async function initFfzEmote() {
  const ffzEmoteSidebar = document.querySelector('#sidebar') as HTMLDivElement
  const firstSectionHeader = document.querySelector('h1 ~ h2.page-header') as HTMLHeadingElement
  const widgetContainer = document.createElement('div')
  firstSectionHeader.insertAdjacentElement('beforebegin', widgetContainer)
  const ffzPanelClass = 'panel panel-default'
  const ffzEmoteName = location.pathname.match(/^\/emoticon\/([0-9]+)-(.+)$/)?.[2]
  const ffzEmoteId = location.pathname.match(/^\/emoticon\/([0-9]+)-(.+)$/)?.[1]
  if (!ffzEmoteName || !ffzEmoteId) return // todo: show error (and report to api)
  const ffzSectionClass = ''
  const ffzSectionClassName = ''
  const ffzHeadingClass = 'panel-heading'
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
    sectionClass: ffzSectionClass, sectionClassName: ffzSectionClassName,
    headingClass: ffzHeadingClass,
  }
  const detachDuplicatesPanel = render(
    () => <DuplicatesPanel provider={EmoteProvider.FFZ} {...ffzAppData} />,
    ffzEmoteSidebar
  )
  const detachEmoteWidget = render(
    () => <EmoteWidget provider={EmoteProvider.FFZ} data={ffzAppData} />,
    widgetContainer
  )

  return () => {
    detachDuplicatesPanel()
    detachEmoteWidget()
  }
}
