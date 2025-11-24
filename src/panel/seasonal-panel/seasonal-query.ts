import {Accessor, createMemo, createResource} from 'solid-js'
import {authFetch} from '../../util/auth-fetch'
import StatusCodes from 'http-status-codes'

export interface Emote {
  provider: 'bttv' | 'ffz',
  providerId: string,
  code: string
}

export interface EmoteGroup {
  id: number,
  name: string,
  emotes: [Emote, Emote][]
}

export function createSeasonalGroupsResource(channelId: Accessor<string | null>) {
  const [seasonalGroups, {mutate: mutateSeasonalGroups, refetch}] = createResource(channelId, async (channelId) => {
    if (!channelId) return []
    return await authFetch(`https://${API_HOST}/group/${channelId}/`)
      .then(async res => {
        if (res.ok) {
          return await res.json() as Promise<EmoteGroup[]>
        } else if (res.status === StatusCodes.UNAUTHORIZED || res.status === StatusCodes.FORBIDDEN) {
          return {error: res.status}
        } else {
          return {error: null}
        }
      })
      .catch(() => ({error: null}))
  })
  const seasonalGroupsArray = createMemo(() => {
    const seasonalGroupsValue = seasonalGroups()
    if (Array.isArray(seasonalGroupsValue)) return seasonalGroupsValue
    else return []
  })

  return {seasonalGroups, seasonalGroupsArray, mutateSeasonalGroups, refetch}
}
