import {Accessor, createMemo, createResource, ResourceFetcher} from 'solid-js'
import {batchedFetch} from './batched-fetch'
import {EmoteProvider} from './emote-context'
import {cache, makeCache} from '@solid-primitives/resource'

export const DATE_RANGE_LENGTH = 5

type EmoteUsage = Record<`${number}-${number}-${number}`, number>

export function createEmoteUsagesResource(provider: EmoteProvider, emoteIds: Accessor<string[]>, channelId: Accessor<string>) {
  // todo implement fail visualisation
  const [fetcher] = makeCache((async ([channelId, emoteIds]) => {
    const usageData = await batchedFetch(`https://${API_HOST}/emote/${provider.toLowerCase()}/${emoteIds.join(',')}/usage/${channelId}`, {
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
    storageKey: `usage-${channelId()}-${emoteIds().join('')}`
  })
  const [usage] = createResource(createMemo(() => [channelId(), emoteIds()] as [string, string[]]), fetcher)
  return usage
}

export const createEmoteUsageResource = (provider: EmoteProvider, emoteId: string, channelId: Accessor<string>) => {
  const usage = createEmoteUsagesResource(provider, () => [emoteId], channelId)
  return createMemo(() => Object.values(usage() ?? {})[0])
}
