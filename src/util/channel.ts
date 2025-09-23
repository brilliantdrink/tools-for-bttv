import {createEffect, createSignal, onMount} from 'solid-js'
import {queryFutureElement} from './future-element'
import {BTTVgetChannelId} from './bttv-emotes'
import {EmoteProvider} from './emote-context'
import {FFZgetChannelDisplayName, FFZgetChannelId} from './ffz-emotes'

export function createChannelState(provider: EmoteProvider, observe = false) {
  const [channelDisplayName, setChannelDisplayName] = createSignal<string>(null!)
  const [channelName, setChannelName] = createSignal<string>(null!)
  const [channelId, setChannelId] = createSignal<string>(null!)

  onMount(async () => {
    if (!(provider in getChannelName)) return
    await getChannelName[provider]().then(displayName => {
      if (!displayName) return
      setChannelDisplayName(displayName)
      setChannelName(displayName.toLowerCase())
    })
    if (observe) {
      const observer = new MutationObserver(() => getChannelName[provider]().then(setChannelName))
      observer.observe(
        await queryFutureElement('[id*=menu-button]:has(img)') as HTMLElement,
        {childList: true, subtree: true}
      )
    }
  })

  createEffect(() => {
    if (!channelName()) return
    if (!(provider in getChannelId)) return
    getChannelId[provider](channelName()).then(setChannelId)
    getChannelDisplayName[provider as keyof typeof getChannelDisplayName]?.(channelName()).then(setChannelDisplayName)
  })

  if (observe) return {channelDisplayName, channelName, channelId}
  else return {
    channelDisplayName,
    channelName,
    channelId,
    setChannelName: (name: string) => setChannelName(name.toLowerCase()),
    setChannelId
  }
}

const getChannelName = {
  [EmoteProvider.BTTV]: getChannelDisplayNameBttv,
  [EmoteProvider.FFZ]: getChannelDisplayNameFfz,
}

const getChannelDisplayName = {
  [EmoteProvider.FFZ]: FFZgetChannelDisplayName,
}

const getChannelId = {
  [EmoteProvider.BTTV]: BTTVgetChannelId,
  [EmoteProvider.FFZ]: FFZgetChannelId,
}

export async function getChannelDisplayNameBttv() {
  return (await queryFutureElement('[id*=menu-button]:has(img)') as HTMLElement).innerText.trim()
}

export async function getChannelDisplayNameFfz() {
  const title = (document.querySelector('#channel')?.childNodes.item(0) as Text | undefined)?.wholeText.trim()
  return title ?? (document.querySelector('img.navbar-avatar') as null | HTMLImageElement)?.title
}
