import {Accessor, createMemo, createResource, ResourceFetcher} from 'solid-js'
import {makeCache} from '@solid-primitives/resource'
import md5 from 'md5'
import {EmoteProvider} from './emote-context'
import {batchedFetch} from './batched-fetch'

const notesCache = {}

export function createEmoteNotesResource(provider: EmoteProvider, emoteIds: Accessor<string[]>, channelId: Accessor<string | null>) {
  const [fetcher] = makeCache((async ([channelId, emoteIds]) => {
    if (channelId === null) return {}
    return await batchedFetch(`https://${API_HOST}/emote/${provider.toLowerCase()}/${emoteIds.join(',')}/notes/${channelId}`, {
      debounceTime: 300,
      useAuth: true,
    })
      .then(res => res.json() as Promise<Record<string, { note: string, doNotRemove: boolean }>>)
      .catch(() => null)
  }) as ResourceFetcher<[string, string[]], Record<string, { note: string, doNotRemove: boolean }>>, {
    expires: 1000 * 60 * 10,
    sourceHash: source => md5(source[0] + source[1].join()),
    cache: notesCache,
  })
  const [emoteNotes] = createResource(createMemo(() => [channelId(), emoteIds()] as [string, string[]]), fetcher)
  return emoteNotes
}
