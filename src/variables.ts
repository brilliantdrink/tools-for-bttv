import {EmoteData} from './util/emote-context'
import {BTTVEmote, BTTVGlobalEmote} from './util/bttv-emotes'
import {match} from 'path-to-regexp'
import {FFZEmoteData} from './util/ffz-emotes'

// export const dashId = 'bttv-ffz-helper'
// export const inIframe = () => window.self !== window.top

export const bttvOrigin = 'betterttv.com'
export const bttvCdnOrigin = 'cdn.betterttv.net'
export const ffzOrigin = 'www.frankerfacez.com'
export const ffzCdnOrigin = 'cdn.frankerfacez.com'

export const extName = 'Tools for BTTV'

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export const bttvEmoteImage = (id: string) => `https://${bttvCdnOrigin}/emote/${id}/3x.webp`
export const bttvEmoteLink = (id: string) => `https://${bttvOrigin}/emotes/${id}`

export const ffzEmoteImage = (id: string, animated?: boolean) => `https://${ffzCdnOrigin}/emoticon/${id}/${animated ? 'animated/' : ''}2`
export const ffzEmoteLink = (id: string, code: string) => `https://${ffzOrigin}/emoticon/${id}-${code}`

export const bttvFormatEmoteToToolsEmote = (emote: BTTVEmote | BTTVGlobalEmote): Omit<EmoteData, 'provider'> => {
  const data: Omit<EmoteData, 'provider'> = {
    id: emote.id,
    code: emote.code,
  }
  if (emote.animated) data.animated = true
  return data
}
export const ffzFormatEmoteToToolsEmote = (emote: FFZEmoteData): Omit<EmoteData, 'provider'> => {
  const data: Omit<EmoteData, 'provider'> = {
    id: String(emote.id),
    code: emote.name,
  }
  if (emote.animated) data.animated = true
  return data
}

export const bttvDashPath = 'dashboard/emotes/channel'
export const bttvDashBasePath = 'dashboard/emotes/'
const matchBttvEmotePath = match("/emotes/:id")
const bttvEmotesPages = ['popular', 'trending', 'shared', 'global']
export const isBttvEmotePath = (path: string) => {
  const match = matchBttvEmotePath(path)
  if (!match) return false
  else return !bttvEmotesPages.includes(match?.params?.id as string)
}

export const ffzDashPath = '/channel'
const matchFfzEmotePath = match("/emoticon/:id")
export const isFfzEmotePath = (path: string) => {
  const match = matchFfzEmotePath(path)
  return !!match
}

export enum AttachmentPoints {
  BttvDash,
  BttvDashSet,
  BttvEmote,
  FfzDash,
  FfzEmote,
}
