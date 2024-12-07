import {EmoteData} from './emote-index'
import {bttvFormatEmoteToToolsEmote} from './variables'
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

export async function getFFZEmotes(channel: string): Promise<Omit<EmoteData, 'provider'>[]> {
  const ffzChannelData = await fetch(`https://api.frankerfacez.com/v1/user/${channel.toLowerCase()}`).then(res => res.json()) as FFZChannelData
  const ffzUserData = await fetch(`https://api.betterttv.net/3/cached/frankerfacez/users/twitch/${ffzChannelData.user.twitch_id}`).then(res => res.json()) as BTTVEmote[]
  return ffzUserData.map(bttvFormatEmoteToToolsEmote)
}
