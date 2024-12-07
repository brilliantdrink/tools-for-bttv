import {EmoteData} from './emote-index'
import {BTTVEmote} from './bttv-emotes'

export const dashId = 'bttv-ffz-helper'
export const inIframe = () => window.self !== window.top

export const bttvOrigin = 'betterttv.com'
export const ffzOrigin = 'www.frankerfacez.com'

export const extName = 'Tools for BTTV'

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export const bttvEmoteImage = (id: string) => `https://cdn.betterttv.net/emote/${id}/3x.webp`
export const bttvEmoteLink = (id: string) => `https://betterttv.com/emotes/${id}`

export const ffzEmoteImage = (id: string, animated?: true) => `https://cdn.frankerfacez.com/emoticon/${id}/${animated ? 'animated/' : ''}2`
export const ffzEmoteLink = (id: string, code: string) => `https://www.frankerfacez.com/emoticon/${id}-${code}`

export const bttvFormatEmoteToToolsEmote = (emote: BTTVEmote): Omit<EmoteData, 'provider'> => {
  const data: Omit<EmoteData, 'provider'> = {
    id: emote.id,
    code: emote.code,
  }
  if (emote.animated) data.animated = true
  return data
}
