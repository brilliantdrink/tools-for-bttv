import {Accessor, createMemo, createResource} from 'solid-js'
import {PartialBy} from '../variables'
import {getFFZEmotes, getFFZGlobalEmotes} from './ffz-emotes'
import {getBTTVEmotes, getBTTVGlobalEmotes} from './bttv-emotes'

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


export function useEmotes(channelId: Accessor<string>) {
  const [emotes] = createResource(channelId, async (channelId) => {
    const emotes: EmoteData[] = []

    function addEmotes(items: PartialBy<EmoteData, 'provider'>[], provider: EmoteProvider, global?: true) {
      emotes.push(...items.map(emote => {
        emote.provider = provider
        emote.global = global
        return emote as EmoteData
      }))
    }

    await Promise.allSettled([
      getBTTVEmotes(channelId).then(emotes => addEmotes(emotes, EmoteProvider.BTTV)),
      getFFZEmotes(channelId).then(emotes => addEmotes(emotes, EmoteProvider.FFZ)),
      getBTTVGlobalEmotes().then(emotes => addEmotes(emotes, EmoteProvider.BTTV, true)),
      getFFZGlobalEmotes().then(emotes => addEmotes(emotes, EmoteProvider.FFZ, true))
    ])

    return emotes
  })

  const overlapping = createMemo(() => {
    const currentEmotes = emotes()
    if (!currentEmotes) return
    const overlapping: [EmoteData, EmoteData][] = []
    for (let i = 0; i < currentEmotes.length; i++) {
      const emoteA = currentEmotes[i]
      for (let j = i + 1; j < currentEmotes.length; j++) {
        const emoteB = currentEmotes[j]
        if (emoteA.code === emoteB.code) overlapping.push([emoteA, emoteB])
      }
    }
    return overlapping
  })

  const likelyDuplicates = createMemo(() => {
    const currentEmotes = emotes()
    if (!currentEmotes) return
    const likelyDuplicates: [EmoteData, EmoteData][] = []
    for (let i = 0; i < currentEmotes.length; i++) {
      const emoteA = currentEmotes[i]
      for (let j = i + 1; j < currentEmotes.length; j++) {
        const emoteB = currentEmotes[j]
        if (emoteA.code.toLowerCase() === emoteB.code.toLowerCase() && emoteA.code !== emoteB.code)
          likelyDuplicates.push([emoteA, emoteB])
      }
    }
    return likelyDuplicates
  })

  return {emotes, overlapping, likelyDuplicates}
}
