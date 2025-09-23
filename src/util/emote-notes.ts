import {Accessor, createMemo, createResource, ResourceFetcher} from 'solid-js'
import {makeCache} from '@solid-primitives/resource'
import {EmoteProvider} from './emote-context'
import {batchedFetch} from './batched-fetch'

export function createEmoteNotesResource(provider: EmoteProvider, emoteIds: Accessor<string[]>, channelId: Accessor<string>) {
  const [fetcher] = makeCache((async ([channelId, emoteIds]) => {
    return await batchedFetch(`https://${API_HOST}/emote/${provider.toLowerCase()}/${emoteIds.join(',')}/notes/${channelId}`, {
      debounceTime: 300,
      useAuth: true,
    })
      .then(res => res.json() as Promise<Record<string, { note: string, doNotRemove: boolean }>>)
      .catch(() => null)
  }) as ResourceFetcher<[string, string[]], Record<string, { note: string, doNotRemove: boolean }>>, {
    expires: 1000 * 60 * 10,
    storageKey: `notes-${channelId()}-${emoteIds().join('')}`
  })
  const [emoteNotes] = createResource(createMemo(() => [channelId(), emoteIds()] as [string, string[]]), fetcher)
  return emoteNotes
}
