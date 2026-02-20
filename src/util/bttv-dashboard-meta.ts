import {createResource} from 'solid-js'
import {makeCache} from '@solid-primitives/resource'
import {BTTVEmote} from './bttv-emotes'

export function createDashboardMeta() {
  const [cachedFetcher] = makeCache(() => {
    return fetch('https://api.betterttv.net/3/account/dashboards', {
      headers: {Authorization: `Bearer ${localStorage.getItem('USER_TOKEN')?.replaceAll('"', '')}`}
    }).then(res => {
      if (res.status === 204) return []
      else return res.json() as Promise<BTTVDashboardData[]>
    })
  }, {sourceHash: () => 'bttv-dashboards'})
  const [resource] = createResource(cachedFetcher)
  return resource
}

export interface BTTVDashboardData {
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

export function createEmoteSetMeta(setId: string) {
  const [cachedFetcher] = makeCache(() => {
    return fetch(`https://api.betterttv.net/3/emote_sets/${setId}`, {
      headers: {Authorization: `Bearer ${localStorage.getItem('USER_TOKEN')?.replaceAll('"', '')}`}
    }).then(res => {
      return res.json() as Promise<BTTVSetData>
    })
  }, {sourceHash: () => `bttv-set-${setId}`})
  const [resource] = createResource(cachedFetcher)
  return resource
}

export interface BTTVSetData {
  id	:string
  name:	string
  /** @description id */
  user:	string
  sharedEmotes:	BTTVEmote[]
}

export function createAccountMeta() {
  const [cachedFetcher] = makeCache(() => {
    return fetch('https://api.betterttv.net/3/account', {
      headers: {Authorization: `Bearer ${localStorage.getItem('USER_TOKEN')?.replaceAll('"', '')}`}
    }).then(res => res.json() as Promise<BTTVAccountData>)
  }, {sourceHash: () => 'bttv-account'})
  const [resource] = createResource(cachedFetcher)
  return resource
}

export interface BTTVAccountData {
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
