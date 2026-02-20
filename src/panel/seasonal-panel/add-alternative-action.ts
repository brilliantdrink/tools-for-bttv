import {createSeasonalGroupsResource, Emote, EmoteGroup} from './seasonal-query'
import {EmoteData, EmoteProvider} from '../../util/emote-context'
import {authFetch} from '../../util/auth-fetch'
import {createEmoteModalSignals, EmoteModalType} from './emote-modal'
import error, {ErrorType} from '../../util/error'

export function addAlternative(data: {
  provider: EmoteProvider
  channelId: string | null
  signals: ReturnType<typeof createEmoteModalSignals>
  currentGroup: EmoteGroup | null
  currentEmote: EmoteData | null
  seasonalGroups: ReturnType<typeof createSeasonalGroupsResource>
}) {
  data.signals.setLoading(true)
  const currentGroupValue = data.currentGroup
  if (!currentGroupValue) {
    error({
      type: ErrorType.Action,
      provider: data.provider,
      name: 'addAlternative',
      message: 'Couldn\'t add emote to group',
      detail: `currentGroupValue is falsy: ${currentGroupValue}`,
    })
    return
  }
  let targetEmoteId: string | null | undefined = null
  let altEmoteId: string | null | undefined = null
  if (data.signals.type() === EmoteModalType.AddAlternative) {
    targetEmoteId = data.currentEmote?.id
    altEmoteId = data.signals.selected()
  } else if (data.signals.type() === EmoteModalType.AsAlternative) {
    targetEmoteId = data.signals.selected()
    altEmoteId = data.currentEmote?.id
  }
  if (!targetEmoteId || !altEmoteId) {
    error({
      type: ErrorType.Action,
      provider: data.provider,
      name: 'addAlternative',
      message: 'Couldn\'t add emote to group',
      detail: `One of the emotes is falsy: target emote id: "${targetEmoteId}", alt emote id: "${altEmoteId}", modal type: "${data.signals.type()}", current emote: ${JSON.stringify(data.currentEmote, null, 2)}`,
    })
    return
  }
  new Promise<void>(resolve => setTimeout(resolve, 1000))
  const url = `https://${API_HOST}/group/${data.channelId}/${currentGroupValue.id}/${data.provider.toLowerCase()}/${targetEmoteId}`
  authFetch(url, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({alternative: altEmoteId}),
  }).then(res => {
    if (res.ok) {
      data.seasonalGroups.mutateSeasonalGroups(data.seasonalGroups.seasonalGroupsArray().map(group => {
        if (group.id !== currentGroupValue.id) return group
        const pairIndex = group.emotes.findIndex(([targetEmote]) => targetEmote.providerId === targetEmoteId)
        let newEmotes: [Emote, Emote][]
        if (pairIndex !== -1) {
          newEmotes = group.emotes.toSpliced(pairIndex, 1, [
            group.emotes[pairIndex][0],
            {providerId: altEmoteId, provider: data.provider.toLowerCase() as Emote['provider'], code: ''}
          ])
        } else {
          newEmotes = [...group.emotes, [
            {providerId: targetEmoteId, provider: data.provider.toLowerCase() as Emote['provider'], code: ''},
            {providerId: altEmoteId, provider: data.provider.toLowerCase() as Emote['provider'], code: ''}
          ]]
        }
        return {...group, emotes: newEmotes}
      }))
      data.signals.setOpen(false)
    } else {
      data.signals.setLoading(false)
      error({
        type: ErrorType.Mutate,
        provider: data.provider,
        url, method: 'put',
        message: 'Couldn\'t add emote to group',
        detail: `Server responded with status ${res.status}`,
      })
    }
  })
}
