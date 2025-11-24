import {Accessor, createResource} from 'solid-js'
import {makeCache} from '@solid-primitives/resource'
import {PickOneOnly} from './type'

export function createAccountMeta(info: Accessor<PickOneOnly<{
  name: string,
  ffzId: string,
  id: string
}> | undefined>) {
  const [cachedFetcher] = makeCache<FFZChannelData | null, ReturnType<typeof info>, unknown>((info) => {
    if (!info) return null
    const key = Object.keys(info)[0] as keyof typeof info
    if (info[key] === null) return null
    let url = 'https://api.frankerfacez.com/v1/user/'
    if (key === 'ffzId') url += '_id/'
    if (key === 'id') url += 'id/'
    let value = info[key]
    if (key === 'name') value = value?.toLowerCase()
    return fetch(url + value)
      .then(res => res.json() as Promise<FFZChannelData>)
  }, {sourceHash: source => source ? `ffz-account-${Object.keys(source)[0]}-${Object.values(source)[0]}` : 'null'})
  const [resource] = createResource(info, cachedFetcher)
  return resource
}

export interface FFZChannelData {
  user: {
    id: number,
    twitch_id: number,
    youtube_id: string | null,
    name: string,
    display_name: string | null,
    avatar: string | null,
    max_emoticons: number,
    is_donor: boolean,
    is_subwoofer: boolean,
    sub_months: number,
    sub_lifetime: boolean,
    badges: number[],
    emote_sets: number[]
  },
  badges: {},
  sets: {}
}
