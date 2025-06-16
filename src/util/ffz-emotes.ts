import {EmoteData} from './emote-context'
import {bttvFormatEmoteToToolsEmote, ffzFormatEmoteToToolsEmote} from '../variables'
import {BTTVEmote} from './bttv-emotes'

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

export interface FFZUserData {
  _id: number,
  name: string,
  display_name: string
}

export interface FFZEmoteData {
  id: number,
  name: string,
  height: number,
  width: number,
  public: boolean,
  hidden: boolean,
  modifier: boolean,
  modifier_flags: number,
  owner: FFZUserData,
  artist: null | FFZUserData,
  urls: {
    1: string,
    [key: number]: string
  },
  animated: {
    1: string,
    [key: number]: string
  },
  status: number,
  usage_count: number,
  created_at: string,
  last_updated: string,
}

export interface FFZSetData {
  set: {
    id: number,
    _type: number,
    icon: string,
    title: string,
    description: string,
    css: string,
    emoticons: FFZEmoteData[]
  }
}

const channelIdCache: Record<string, number> = {}

export async function FFZgetChannelId(channel: string) {
  if (channel in channelIdCache) return channelIdCache[channel]
  const ffzChannelData = await fetch(`https://api.frankerfacez.com/v1/user/${channel.toLowerCase()}`).then(res => res.json()) as FFZChannelData
  channelIdCache[channel] = ffzChannelData.user.twitch_id
  return ffzChannelData.user.twitch_id
}

export async function getFFZEmotes(twitchId: string): Promise<Omit<EmoteData, 'provider'>[]> {
  const ffzUserData = await fetch(`https://api.betterttv.net/3/cached/frankerfacez/users/twitch/${twitchId}`).then(res => res.json()) as BTTVEmote[]
  return ffzUserData.map(bttvFormatEmoteToToolsEmote)
}

export async function getFFZGlobalEmotes(): Promise<Omit<EmoteData, 'provider'>[]> {
  const ffzUserData = await fetch(`https://api.frankerfacez.com/v1/set/3`).then(res => res.json()) as FFZSetData
  return ffzUserData.set.emoticons.map(ffzFormatEmoteToToolsEmote)
}
