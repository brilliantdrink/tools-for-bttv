import {bttvCdnOrigin, bttvEmoteImage, bttvEmoteLink, ffzEmoteImage, ffzEmoteLink, PartialBy} from './variables'
import {element} from './util/createElement'
import {getFFZEmotes} from './ffz-emotes'
import {getBTTVEmotes, getBTTVGlobalEmotes} from './bttv-emotes'
import {optimalStringAlignmentDistance} from './dem-lev-distance'

export enum EmoteProvider {
  BTTV = 'BTTV',
  FFZ = 'FFZ',
}

export interface EmoteData {
  code: string
  id: string
  animated?: true
  provider: EmoteProvider
  global?: true
}

export class EmoteIndex {
  private _bttvEmotes: EmoteData[]
  private _bttvGlobalEmotes: EmoteData[]
  private _ffzEmotes: EmoteData[]
  private _ffzGlobalEmotes: EmoteData[]
  overlapping: [EmoteData, EmoteData][]
  overlappingHTML: HTMLDivElement
  likelyDuplicates: [EmoteData, EmoteData][]
  likelyDuplicatesHTML: HTMLDivElement
  perceptualDuplicates: [EmoteData, EmoteData][]
  perceptualDuplicatesHTML: HTMLDivElement

  constructor() {
    this._bttvEmotes = []
    this._bttvGlobalEmotes = []
    this._ffzEmotes = []
    this._ffzGlobalEmotes = []
    this.overlapping = []
    this.overlappingHTML = element('div', {className: 'tfb-emotes-pair-container'})
    this.likelyDuplicates = []
    this.likelyDuplicatesHTML = element('div', {className: 'tfb-emotes-pair-container'})
    this.perceptualDuplicates = []
    this.perceptualDuplicatesHTML = element('div', {className: 'tfb-emotes-pair-container'})
  }

  get allEmotes(): EmoteData[] {
    return [...this.bttvEmotes, ...this.bttvGlobalEmotes, ...this.ffzEmotes, ...this.ffzGlobalEmotes]
  }

  get bttvEmotes(): EmoteData[] {
    return this._bttvEmotes
  }

  set bttvEmotes(bttvEmotes: PartialBy<EmoteData, 'provider'>[]) {
    this._bttvEmotes = bttvEmotes.map(emote => {
      emote.provider = EmoteProvider.BTTV
      return emote as EmoteData
    })
    this.updateDuplicates()
  }

  get bttvGlobalEmotes(): EmoteData[] {
    return this._bttvGlobalEmotes
  }

  set bttvGlobalEmotes(bttvEmotes: PartialBy<EmoteData, 'provider'>[]) {
    this._bttvGlobalEmotes = bttvEmotes.map(emote => {
      emote.provider = EmoteProvider.BTTV
      emote.global = true
      return emote as EmoteData
    })
    this.updateDuplicates()
  }

  get ffzEmotes(): EmoteData[] {
    return this._ffzEmotes
  }

  set ffzEmotes(ffzEmotes: PartialBy<EmoteData, 'provider'>[]) {
    this._ffzEmotes = ffzEmotes.map(emote => {
      emote.provider = EmoteProvider.FFZ
      return emote as EmoteData
    })
    this.updateDuplicates()
  }

  get ffzGlobalEmotes(): EmoteData[] {
    return this._ffzGlobalEmotes
  }

  set ffzGlobalEmotes(ffzEmotes: PartialBy<EmoteData, 'provider'>[]) {
    this._ffzGlobalEmotes = ffzEmotes.map(emote => {
      emote.provider = EmoteProvider.FFZ
      emote.global = true
      return emote as EmoteData
    })
    this.updateDuplicates()
  }

  updateEmotes(channelName: string) {
    return Promise.allSettled([
      getFFZEmotes(channelName).then(emotes => this.ffzEmotes = emotes),
      getBTTVEmotes(channelName).then(emotes => this.bttvEmotes = emotes),
      getBTTVGlobalEmotes(channelName).then(emotes => this.bttvGlobalEmotes = emotes)
    ])
  }

  updateDuplicates() {
    this.overlapping = []
    this.likelyDuplicates = []
    const allEmotes = this.allEmotes
    for (let i = 0; i < allEmotes.length; i++) {
      const emoteA = allEmotes[i]
      for (let j = i + 1; j < allEmotes.length; j++) {
        const emoteB = allEmotes[j]
        if (emoteA.code === emoteB.code) {
          this.overlapping.push([emoteA, emoteB])
        } else if (emoteA.code.toLowerCase() === emoteB.code.toLowerCase()) {
          this.likelyDuplicates.push([emoteA, emoteB])
        }
      }
    }
    // this triggers the mutation observer to remove the loading indicator
    this.overlappingHTML.innerHTML = '-'
    this.overlappingHTML.innerHTML = ''
    for (const emotes of this.overlapping) emotesPairHtml(emotes, this.overlappingHTML)
    this.likelyDuplicatesHTML.innerHTML = '-'
    this.likelyDuplicatesHTML.innerHTML = ''
    for (const emotes of this.likelyDuplicates) emotesPairHtml(emotes, this.likelyDuplicatesHTML)
  }

  async updatePerceptualDuplicates(progress: (done: number) => void) {
    let done = 0
    this.perceptualDuplicates = []
    const allEmotes = this.allEmotes
    for (let i = 0; i < allEmotes.length; i++) {
      const emoteA = allEmotes[i]
      const pHashAPromise = phashServer(emoteA)
      for (let j = i + 1; j < allEmotes.length; j++) {
        const emoteB = allEmotes[j]
        const pHashB = await phashServer(emoteB)
        const pHashA = await pHashAPromise
        const distance = optimalStringAlignmentDistance(pHashA, pHashB)
        if (distance <= 1) this.perceptualDuplicates.push([emoteA, emoteB])
        progress(++done)
      }
    }
    this.perceptualDuplicatesHTML.innerHTML = '-'
    this.perceptualDuplicatesHTML.innerHTML = ''
    for (const emotes of this.perceptualDuplicates) {
      if (emotes[0].global && emotes[1].global) continue
      emotesPairHtml(emotes, this.perceptualDuplicatesHTML)
    }
  }

  findExact(emoteName: string) {
    return this.allEmotes.filter(emote => emote.code === emoteName)
  }

  findNotExact(emoteName: string) {
    return this.allEmotes.filter(emote => emote.code !== emoteName && emote.code.toLowerCase() === emoteName.toLowerCase())
  }
}

export const emoteIndex = new EmoteIndex()

const phashResolves = new Map<string, (phash: string) => void>()
window.onmessage = (e) => {
  if (!window.top) return
  if (e.data.type === 'phash') {
    phashResolves.get(e.data.id)?.(e.data.phash)
  }
};

export const bttvCdnFrame = document.createElement('iframe')
bttvCdnFrame.src = 'https://' + bttvCdnOrigin
bttvCdnFrame.style.visibility = 'hidden'
bttvCdnFrame.style.pointerEvents = 'none'
document.body.appendChild(bttvCdnFrame)

function phashServer(emote: EmoteData) {
  return new Promise<string>((resolve) => {
    phashResolves.set(emote.id, resolve)
    bttvCdnFrame.contentWindow?.postMessage({type: 'emote', emote, id: emote.id}, 'https://' + bttvCdnOrigin)
  })
}

function emotesPairHtml(emotes: [EmoteData, EmoteData], parentElement: HTMLElement) {
  return element('div', {
    className: 'tfb-emotes-container',
    children: emotes.map(emoteCard)
  }, parentElement)
}

export function emoteCard(emote: EmoteData) {
  let pageUrl, imageUrl
  if (emote.provider === EmoteProvider.BTTV) {
    pageUrl = bttvEmoteLink(emote.id)
    imageUrl = bttvEmoteImage(emote.id)
  } else if (emote.provider === EmoteProvider.FFZ) {
    pageUrl = ffzEmoteLink(emote.id, emote.code)
    imageUrl = ffzEmoteImage(emote.id, emote.animated)
  }
  return element('a', {
    className: 'tfb-emote-wrapper',
    href: pageUrl,
    children: [
      element('img', {className: 'tfb-emote-image', src: imageUrl}),
      element('span', {className: 'tfb-emote-name', innerText: emote.code,}),
      element('div', {
        className: 'tfb-emote-provider-wrapper',
        children: [
          element('div', {className: ['tfb-emote-provider', emote.provider.toLowerCase()].join(' ')}),
          emote.global && element('span', {innerText: "(Global)"})
        ].filter(v => v)
      })
    ]
  })
}
