import {bttvFormatEmoteToToolsEmote} from '../variables'

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

export interface BTTVGlobalEmote {
  id: string,
  code: string,
  imageType: string,
  animated: boolean,
  userId: string,
}

export async function getBTTVEmotes(bttvId: string) {
  // "?limited=false&personal=true" hits the cache from hook-fetch.ts
  const bttvUserData = await fetch(`https://api.betterttv.net/3/users/${bttvId}?limited=false&personal=true`).then(res => res.json()) as BTTVUserData
  return bttvUserData.channelEmotes.concat(bttvUserData.sharedEmotes).map(bttvFormatEmoteToToolsEmote)
}

export async function getBTTVEmote(bttvId: string) {
  const emoteData = await fetch(`https://api.betterttv.net/3/emotes/${bttvId}`).then(res => res.json()) as BTTVEmote
  return bttvFormatEmoteToToolsEmote(emoteData)
}

export async function getBTTVCachedEmotes(twitchId: string) {
  const bttvUserData = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${twitchId}`).then(res => res.json()) as BTTVUserData
  return bttvUserData.channelEmotes.concat(bttvUserData.sharedEmotes).map(bttvFormatEmoteToToolsEmote)
}

export async function getBTTVGlobalEmotes() {
  const bttvEmotes = await fetch(`https://api.betterttv.net/3/cached/emotes/global`).then(res => res.json()) as BTTVGlobalEmote[]
  return bttvEmotes.map(bttvFormatEmoteToToolsEmote)
}
