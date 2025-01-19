import {queryFutureElement} from './util/future-element'
import {dashId, extName} from './variables'
import {emoteCard, emoteIndex} from './emote-index'
import {element} from './util/createElement'
import {emoteListDetails} from './common-ui'
import {match} from 'path-to-regexp'

const dashPath = 'dashboard/emotes/channel'
const matchEmotePath = match("/emotes/:id")
const emotesPages = ['popular', 'trending', 'shared', 'global']
const isEmotePath = (path: string) => {
  const match = matchEmotePath(path)
  if (!match) return false
  else return !emotesPages.includes(match?.params?.id as string)
}

export async function attachBTTV() {
  let previousPath: string | null = null
  let previousChannelName = await getChannelName()

  async function refreshHTML() {
    const path = location.pathname
    const channelName = await getChannelName()
    if (path.includes(dashPath)) {
      if (!previousPath || !previousPath.includes(dashPath)) {
        removePanel()
        addDashPanel()
      } else if (previousChannelName !== channelName) {
        emoteIndex.updateEmotes(await getChannelName())
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
    previousChannelName = channelName
  }

  refreshHTML()

  const observer = new MutationObserver(refreshHTML)
  observer.observe(document.body, {childList: true, subtree: true});
}

async function getChannelName() {
  return (await queryFutureElement('[id*=menu-button]:has(img)') as HTMLElement).innerText.trim().toLowerCase()
}

async function addDashPanel() {
  const tabsWrapper = await queryFutureElement('.chakra-tabs:has([role="tablist"])') as HTMLDivElement
  const el = element('div', {className: 'tfb-bttv', id: dashId}, tabsWrapper)
  element('p', {className: 'tfb-title', innerText: extName}, el)
  emoteListDetails('Overlapping emote names', emoteIndex.overlappingHTML, el)
  emoteListDetails('Likely duplicates', emoteIndex.likelyDuplicatesHTML, el)
  /*const runPerceptualDuplicateDetectionButton = element('button', {innerText: 'Run'})
  runPerceptualDuplicateDetectionButton.addEventListener('click', () => {
    const emoteAmount = emoteIndex.allEmotes.length
    const comparisonsAmount = (emoteAmount ** 2) / 2 - emoteAmount / 2
    const progress = element('progress', {max: comparisonsAmount, value: 0}, perceptualDuplicates)
    const comparisonsDone = (done: number) => `${done} / ${comparisonsAmount} comparisons (${emoteAmount} emotes)`
    const progressLabel = element('span', {innerText: comparisonsDone(0)}, perceptualDuplicates)
    emoteIndex.updatePerceptualDuplicates(done => {
      progress.value = done
      progressLabel.innerText = comparisonsDone(done)
    })
  })
  const perceptualDuplicates = element('div', {
    children: [
      runPerceptualDuplicateDetectionButton,
      emoteIndex.perceptualDuplicatesHTML
    ]
  })
  emoteListDetails('Visually similar', perceptualDuplicates, el, true)*/

  emoteIndex.updateEmotes(await getChannelName())
}

async function addEmotePanel() {
  const firstEmotePanel = await queryFutureElement('[class*=_panel]') as HTMLDivElement
  const wrapper = element('div', {className: 'tfb-Emote_row'})
  firstEmotePanel.replaceWith(wrapper)
  firstEmotePanel.style.flexGrow = '1'
  firstEmotePanel.style.display = 'flex'
  firstEmotePanel.style.flexDirection = 'column'
  const emoteName = (firstEmotePanel.querySelector('[class*=_section] > p') as HTMLParagraphElement | null)?.innerText.trim()
  const emoteSectionClasses = firstEmotePanel.querySelector('[class*=_section]')?.classList.toString()
  const emoteSectionClassName = Array.from(firstEmotePanel.querySelector('[class*=_section]')?.classList ?? [])
    .find(name => name.includes('_section'))
  const container = element('div', {className: `tfb-emotes-list chakra-stack ${emoteSectionClassName}`})
  const el = element('div', {
    className: `tfb-bttv ${firstEmotePanel.classList.toString()}`,
    children: [
      element('div', {
        className: emoteSectionClasses,
        children: element('p', {className: 'chakra-text css-0', innerText: extName})
      }),
      element('hr', {className: 'chakra-divider'}),
      container
    ]
  }, wrapper)
  wrapper.append(firstEmotePanel)

  await emoteIndex.updateEmotes(await getChannelName())
  const overlapping = emoteIndex.findExact(emoteName ?? '')
  if (overlapping.length > 0) {
    element('p', {className: 'tfb-heading', innerText: 'Would overlap with'}, container)
    overlapping.forEach(emoteData => {
      container.append(emoteCard(emoteData))
    })
  }
  const likelyDupes = emoteIndex.findNotExact(emoteName ?? '')
  if (likelyDupes.length > 0) {
    element('p', {className: 'tfb-heading', innerText: 'Likely duplicates'}, container)
    likelyDupes.forEach(emoteData => {
      container.append(emoteCard(emoteData))
    })
  }
  if ((overlapping.length + likelyDupes.length) === 0) {
    element('p', {innerText: 'This emote doesn\'t overlap\nwith any in your library.'}, container)
  }
}

function removePanel() {
  document.querySelector(`#${dashId}`)?.remove()
}
