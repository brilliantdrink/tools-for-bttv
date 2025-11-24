import {Accessor, createEffect, createMemo, createResource} from 'solid-js'
import {bttvOrigin, PartialBy} from '../variables'
import {getFFZEmotes, getFFZGlobalEmotes} from './ffz-emotes'
import {getBTTVCachedEmotes, getBTTVEmotes, getBTTVGlobalEmotes} from './bttv-emotes'
import {createChannelInfo} from './channel'
import {CacheEntry, makeCache} from '@solid-primitives/resource'
import {makeBatchableCache} from './batchable-cache'

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

export type ProviderlessEmoteData = Omit<EmoteData, "provider">
type ArrayConformCacheEntry = CacheEntry<ProviderlessEmoteData[], string | null>
type ProviderlessEmoteDataCacheEntry = CacheEntry<ProviderlessEmoteData | ProviderlessEmoteData[], string | null>

export const emoteCache = new Proxy(makeBatchableCache(), {
  set(target: Record<string, any>, p: string, newValue: ProviderlessEmoteDataCacheEntry): boolean {
    target[p] = newValue
    if (!p.includes(',') && Array.isArray(newValue.data)) {
      for (const emote of newValue.data) {
        target[p.replace(String(newValue.source), emote.id)] = {source: emote.id, data: emote, ts: newValue.ts}
      }
    }
    return true
  }
}) as Record<string, ProviderlessEmoteDataCacheEntry>

export function useEmotes(channelId: Accessor<string | null>) {
  let bttvEmotes
  // hmmm
  if (location.host === bttvOrigin) {
    const knownBTTVInfo = createMemo(() => ({id: channelId()}))
    const bttvChannelInfo = createChannelInfo(EmoteProvider.BTTV, knownBTTVInfo)

    const [bttvEmotesFetcher] = makeCache<ProviderlessEmoteData[], string | null, unknown>(
        (id: string | null) => !id ? [] : getBTTVEmotes(id),
        {cache: emoteCache as Record<string, ArrayConformCacheEntry>, sourceHash: source => `bttv-local-${source}`}
      )
    ;[bttvEmotes] = createResource(bttvChannelInfo.bttvId, bttvEmotesFetcher)
  } else {
    const [bttvEmotesFetcher] = makeCache<ProviderlessEmoteData[], string | null, unknown>(
        (id: string | null) => !id ? [] : getBTTVCachedEmotes(id),
        {cache: emoteCache as Record<string, ArrayConformCacheEntry>, sourceHash: source => `bttv-local-${source}`}
      )
    ;[bttvEmotes] = createResource(channelId, bttvEmotesFetcher)
  }
  const [ffzEmotesFetcher] = makeCache<ProviderlessEmoteData[], string | null, unknown>(
    (id: string | null) => !id ? [] : getFFZEmotes(id),
    {cache: emoteCache as Record<string, ArrayConformCacheEntry>, sourceHash: source => `ffz-local-${source}`}
  )
  const [ffzEmotes] = createResource(channelId, ffzEmotesFetcher)
  const [bttvGlobalEmotes] = createResource(getBTTVGlobalEmotes)
  const [ffzGlobalEmotes] = createResource(getFFZGlobalEmotes)

  const emotes = createMemo(() => {
    const emotes: EmoteData[] = []

    function addEmotes(items: PartialBy<EmoteData, 'provider'>[], provider: EmoteProvider, global?: true) {
      emotes.push(...items.map(emote => {
        emote.provider = provider
        emote.global = global
        return emote as EmoteData
      }))
    }

    addEmotes(bttvEmotes() ?? [], EmoteProvider.BTTV)
    addEmotes(ffzEmotes() ?? [] as PartialBy<EmoteData, "provider">[], EmoteProvider.FFZ)
    addEmotes(bttvGlobalEmotes() ?? [], EmoteProvider.BTTV, true)
    addEmotes(ffzGlobalEmotes() ?? [], EmoteProvider.FFZ, true)

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
