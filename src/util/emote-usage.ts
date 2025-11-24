import {Accessor, createMemo, createResource, ResourceFetcher} from 'solid-js'
import {makeCache} from '@solid-primitives/resource'
import {batchedFetch} from './batched-fetch'
import {EmoteProvider} from './emote-context'
import {makeBatchableCache} from './batchable-cache'

export const DATE_RANGE_LENGTH = 5

type EmoteUsage = Record<`${number}-${number}-${number}`, number>

const usageCache = makeBatchableCache(key => key.split('-')[1])

export function createEmoteUsagesCachedFetcher(provider: EmoteProvider) {
  const [fetcher] = makeCache((async ([channelId, emoteIds]) => {
    const usageData = channelId === null ? {} as EmoteUsage : await batchedFetch(`https://${API_HOST}/emote/${provider.toLowerCase()}/${emoteIds.join(',')}/usage/${channelId}`, {
      debounceTime: 300,
      useAuth: true,
    })
      .then(async res => {
        const str = await res.text()
        if (!str) return {}
        else return JSON.parse(str) as Record<string, EmoteUsage> | EmoteUsage
      })
      .catch(err => {
        console.error(err)
        return {}
      })
    const usageDatas: Record<string, EmoteUsage> = emoteIds.length === 1 ? {[emoteIds[0]]: usageData} : usageData
    const formattedDatas: Record<string, [string, number][]> = {}
    for (const emoteId in usageDatas) {
      const date = new Date()
      const usageData = usageDatas[emoteId]
      const all30Days: EmoteUsage = {}
      for (let i = 0; i < 30 / DATE_RANGE_LENGTH; i++) {
        let dateRangeString = date.toISOString().match(/^[\d-]+/)?.[0] as `${number}-${number}-${number}`
        if (!dateRangeString) continue
        for (let j = 0; j < DATE_RANGE_LENGTH; j++) {
          let dateString = date.toISOString().match(/^[\d-]+/)?.[0] as `${number}-${number}-${number}`
          if (!dateString) continue
          all30Days[dateRangeString] ??= 0
          all30Days[dateRangeString] += usageData[dateString] ?? 0
          date.setDate(date.getDate() - 1)
        }
      }
      formattedDatas[emoteId] = Object.entries(all30Days).sort(([keyA], [keyB]) =>
        Number(keyA.replaceAll('-', '')) - Number(keyB.replaceAll('-', ''))
      )
    }
    return formattedDatas
  }) as ResourceFetcher<[string, string[]], Record<string, [string, number][]>>, {
    expires: 1000 * 60 * 10,
    sourceHash: source => {
      return source[1].map(v => source[0] + '-' + v).join(',')
    },
    cache: usageCache,
  })
  return fetcher
}

export function createEmoteUsagesResource(provider: EmoteProvider, emoteIds: Accessor<string[]>, channelId: Accessor<string | null>) {
  // todo implement fail visualisation
  const [usage] = createResource(createMemo(() => [channelId(), emoteIds()] as [string, string[]]), createEmoteUsagesCachedFetcher(provider))
  return usage
}

export const createEmoteUsageResource = (provider: EmoteProvider, emoteId: string, channelId: Accessor<string | null>) => {
  const fetcher = createEmoteUsagesCachedFetcher(provider)
  const [usage] = createResource<[string, number][], [string, string[]], unknown>(
    createMemo(() => [channelId(), [emoteId]] as [string, string[]]),
    (source, info) => {
      const fetched = fetcher(source, {...info, value: info.value ? {[source[0]]: info.value} : undefined})
      if (fetched instanceof Promise) return fetched.then(array => Object.values(array ?? {})[0]) as Promise<[string, number][]>
      else return Object.values(fetched ?? {})[0] as [string, number][]
    }
  )
  return usage
}
