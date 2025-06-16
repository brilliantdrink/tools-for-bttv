import {createEffect, createSignal} from 'solid-js'
import {queryFutureElement} from './future-element'
import {BTTVgetChannelId} from './bttv-emotes'
import {EmoteProvider} from './emote-context'
import {FFZgetChannelId} from './ffz-emotes'

export function useChannel(provider: EmoteProvider) {
  const [channelDisplayName, setChannelDisplayName] = createSignal<string>(null!)
  const [channelName, setChannelName] = createSignal<string>(null!)
  const [channelId, setChannelId] = createSignal<string>(null!)

  createEffect(async () => {
    let getChannelName = null
    if (provider === EmoteProvider.BTTV) getChannelName = getChannelDisplayNameBttv
    else if (provider === EmoteProvider.FFZ) getChannelName = getChannelDisplayNameFfz
    if (!getChannelName) return
    await getChannelName().then(displayName => {
      setChannelDisplayName(displayName)
      setChannelName(displayName.toLowerCase())
    })
    const observer = new MutationObserver(() => getChannelName().then(setChannelName))
    observer.observe(
      await queryFutureElement('[id*=menu-button]:has(img)') as HTMLElement,
      {childList: true, subtree: true}
    )
  })

  createEffect(() => {
    if (!channelName()) return
    let getChannelId = null
    if (provider === EmoteProvider.BTTV) getChannelId = BTTVgetChannelId
    else if (provider === EmoteProvider.FFZ) getChannelId = FFZgetChannelId
    if (!getChannelId) return
    getChannelId(channelName()).then(setChannelId)
  })

  return {channelDisplayName, channelName, channelId}
}

export async function getChannelDisplayNameBttv() {
  return (await queryFutureElement('[id*=menu-button]:has(img)') as HTMLElement).innerText.trim()
}

export async function getChannelDisplayNameFfz() {
  return ((await queryFutureElement('#channel')).childNodes.item(0) as Text).wholeText.trim()
}
