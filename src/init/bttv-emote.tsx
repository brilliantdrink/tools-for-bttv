import {render} from 'solid-js/web'
import {queryFutureElement} from '../util/future-element'
import {EmoteProvider} from '../util/emote-context'
import {EmoteWidget} from '../emote-widget/emote-widget'

export default async function initBttvEmote() {
  const column = await queryFutureElement('[class*=_column]') as HTMLDivElement
  const halfWidth = column.parentElement?.getAttribute('colums' /* sic !!! */) === '2'
  const root = document.createElement('div')
  if (column.children.length === 1) column.appendChild(root)
  else column.insertBefore(root, column.children[1])
  const bttvFirstEmotePanel = await queryFutureElement('[class*=_panel]') as HTMLDivElement
  const bttvPanelClass = bttvFirstEmotePanel.classList.toString()
  const bttvEmoteName = (bttvFirstEmotePanel.querySelector('[class*=_section] > p') as HTMLParagraphElement | null)?.innerText.trim()
  const bttvEmoteId = location.pathname.match(/^\/emotes\/([0-9a-f]+)(\/.)?$/)?.[1]
  if (!bttvEmoteName || !bttvEmoteId) return // todo: show error (and report to api)
  const bttvSectionClass = bttvFirstEmotePanel.querySelector('[class*=_section]')?.classList.toString()
  const bttvSectionClassName = Array.from(bttvFirstEmotePanel.querySelector('[class*=_section]')?.classList ?? [])
    .find(name => name.includes('_section'))
  if (!bttvSectionClass || !bttvSectionClassName) return // todo: show error (and report to api)
  const bttvAppData = {
    emoteName: bttvEmoteName, emoteId: bttvEmoteId, panelClass: bttvPanelClass,
    sectionClass: bttvSectionClass, sectionClassName: bttvSectionClassName, halfWidth,
  }
  return render(
    () => <EmoteWidget provider={EmoteProvider.BTTV} data={bttvAppData} />,
    root
  )
}
