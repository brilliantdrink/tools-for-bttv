import {bttvFormatEmoteToToolsEmote} from './variables'
import {FFZChannelData} from './ffz-emotes'

export interface BTTVUserData {
  id: string,
  bots: string[],
  avatar: string,
  channelEmotes: BTTVEmote[],
  sharedEmotes: BTTVEmote[],
}

export interface BTTVEmote {
  id: string,
  code: string,
  imageType: string,
  animated: boolean,
  user?: {
    id: string,
    name: string,
    displayName: string,
    providerId: string,
  }
}

export async function getBTTVEmotes(channel: string) {
  const ffzChannelData = await fetch(`https://api.frankerfacez.com/v1/user/${channel.toLowerCase()}`).then(res => res.json()) as FFZChannelData
  const bttvUserData = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${ffzChannelData.user.twitch_id}`).then(res => res.json()) as BTTVUserData
  return bttvUserData.channelEmotes.concat(bttvUserData.sharedEmotes).map(bttvFormatEmoteToToolsEmote)
}
