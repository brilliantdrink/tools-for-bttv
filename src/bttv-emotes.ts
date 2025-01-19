import {bttvFormatEmoteToToolsEmote} from './variables'
import {FFZChannelData} from './ffz-emotes'

export interface BTTVUserData {
  id: string,
  bots: string[],
  avatar: string,
  channelEmotes: BTTVEmote[],
  sharedEmotes: BTTVEmote[],
}

export interface BTTVDashboardData {
  id: string,
  name: string,
  displayName: string,
  providerId: string,
  createdAt: string,
  avatar: string,
  flags: number,
  bots: string[],
  subscriptionId: string,
  subscriptionCreatedAt: string,
  subscriptionBadgeUrl: string,
  subscriptionBadge: boolean,
  glow: boolean,
  plan: string,
  limits: {
    liveEmotes: number,
    inventoryEmotes: number,
    personalEmotes: number,
    editors: number,
    dashboards: number,
    emoteSets: number
  },
  discord: {
    userId: null | string,
    guildId: null | string,
    lastError: null | unknown
  },
  email: string
}

export interface BTTVDashboardsData {
  id: string,
  name: string,
  displayName: string,
  providerId: string,
  avatar: string,
  limits: {
    liveEmotes: number,
    inventoryEmotes: number,
    personalEmotes: number,
    editors: number,
    dashboards: number,
    emoteSets: number
  },
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

export async function getBTTVEmotes(channel: string) {
  const authHeader = {headers: {Authorization: `Bearer ${localStorage.getItem('USER_TOKEN')?.replaceAll('"', '')}`}}
  const bttvLoggedInAccount = await fetch(`https://api.betterttv.net/3/account`, authHeader).then(res => res.json()) as BTTVDashboardData
  let userId: string | undefined
  if (channel.toLowerCase() === bttvLoggedInAccount.name) userId = bttvLoggedInAccount.providerId
  else {
    const bttvDashboards = await fetch(`https://api.betterttv.net/3/account/dashboards`, authHeader).then(res => res.json()) as BTTVDashboardsData[]
    userId = bttvDashboards.find(dash => channel.toLowerCase() === dash.name)?.providerId
  }
  if (!userId) throw new Error('Found invalid user')
  const bttvUserData = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${userId}`).then(res => res.json()) as BTTVUserData
  return bttvUserData.channelEmotes.concat(bttvUserData.sharedEmotes).map(bttvFormatEmoteToToolsEmote)
}

export async function getBTTVGlobalEmotes(channel: string) {
  const bttvEmotes =  await fetch(`https://api.betterttv.net/3/cached/emotes/global`).then(res => res.json()) as BTTVGlobalEmote[]
  return bttvEmotes.map(bttvFormatEmoteToToolsEmote)
}
