import {queryFutureElement} from './util/future-element'
import {dashId, extName} from './variables'
import {element} from './util/createElement'
import {emoteCard, EmoteIndex, emoteIndex} from './emote-index'
import {emoteListDetails} from './common-ui'
import {match} from 'path-to-regexp'

const dashPath = '/channel'
const matchEmotePath = match("/emoticon/:id")
const isEmotePath = (path: string) => {
  const match = matchEmotePath(path)
  return !!match
}

export async function attachFFZ() {
  let previousPath: string | null = null

  async function refreshHTML() {
    const path = location.pathname
    if (path.includes(dashPath)) {
      if (!previousPath || !previousPath.includes(dashPath)) {
        removePanel()
        addDashPanel()
      }
    } else if (isEmotePath(path)) {
      if (!previousPath || !isEmotePath(previousPath)) {
        removePanel()
        addEmotePanel()
      }
    } else {
      removePanel()
    }
    previousPath = path
  }

  refreshHTML()

  const observer = new MutationObserver(refreshHTML)
  observer.observe(document.body, {childList: true, subtree: true});
}

async function getChannelName() {
  return ((await queryFutureElement('#channel')).childNodes.item(0) as Text).wholeText.trim()
}

async function addDashPanel() {
  const sidebar = await queryFutureElement('#sidebar') as HTMLDivElement
  const el = element('div', {className: 'panel panel-default tfb-ffz', id: dashId}, sidebar)
  const title = element('div', {className: 'panel-heading', innerText: extName}, el)
  const container = element('div', {className: 'tfb-ffz-container'}, el)
  emoteListDetails('Overlapping emote names', emoteIndex.overlappingHTML, container)
  emoteListDetails('Likely duplicates', emoteIndex.likelyDuplicatesHTML, container)

  emoteIndex.updateEmotes(await getChannelName())
}

async function addEmotePanel() {
  const sidebar = await queryFutureElement('#sidebar') as HTMLDivElement
  const el = element('div', {className: 'panel panel-default tfb-ffz', id: dashId}, sidebar)
  const title = element('div', {className: 'panel-heading', innerText: extName}, el)
  const container = element('div', {className: 'list-group'}, el)
  // const list = element('div', {className: 'tfb-ffz tfb-emotes-list'}, container)

  const channelsPanel = Array.from(sidebar.querySelectorAll('.panel')).find(el =>
    (el.querySelector('.panel-heading') as HTMLElement | null)?.innerText.toLowerCase() === 'Add to Channel'.toLowerCase()
  ) as HTMLElement | null
  const channels = Array.from((channelsPanel?.querySelectorAll('.list-group-item') ?? [])).map(el => (el.childNodes.item(0) as Text).wholeText.trim())
  const emoteName = ((await queryFutureElement('#emoticon')).childNodes.item(0) as Text).wholeText.trim()
  for (const channel of channels) {
    const channelEmoteIndex = new EmoteIndex()
    await channelEmoteIndex.updateEmotes(channel.toLowerCase())

    const listItem = element('div', {className: 'list-group-item'}, container)

    element('p', {className: 'tfb-section-heading', innerText: channel}, listItem)
    const overlapping = channelEmoteIndex.findExact(emoteName ?? '')
    if (overlapping.length > 0) {
      element('p', {className: 'tfb-heading', innerText: 'Would overlap with'}, listItem)
      overlapping.forEach(emoteData => {
        listItem.append(emoteCard(emoteData))
      })
    }
    const likelyDupes = channelEmoteIndex.findNotExact(emoteName ?? '')
    if (likelyDupes.length > 0) {
      element('p', {className: 'tfb-heading', innerText: 'Likely duplicates'}, listItem)
      likelyDupes.forEach(emoteData => {
        listItem.append(emoteCard(emoteData))
      })
    }
    if (overlapping.length + likelyDupes.length === 0) {
      element('p', {className: 'tfb-info', innerText: 'This emote doesn\'t overlap\nwith any in your library.'}, listItem)
    }
  }
}

function removePanel() {
  document.querySelector(`#${dashId}`)?.remove()
}
