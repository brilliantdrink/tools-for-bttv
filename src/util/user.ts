import {createEffect, createMemo, createSignal} from 'solid-js'
import {EmoteProvider} from './emote-context'
import {queryFutureElement} from './future-element'
import {createAccountMeta} from './bttv-dashboard-meta'

export function useUser(provider: EmoteProvider) {
  if (provider === EmoteProvider.BTTV) {
    const account = createAccountMeta()
    const userDisplayName = createMemo(() => account()?.displayName ?? null)
    const userName = createMemo(() => account()?.name ?? null)
    const userId = createMemo(() => account()?.providerId ?? null)

    return {userDisplayName, userName, userId}
  } else if (provider === EmoteProvider.FFZ) {
    const [userDisplayName, setUserDisplayName] = createSignal<string | null>(null)
    const [userName, setUserName] = createSignal<string | null>(null)
    const [userId, setUserId] = createSignal<string | null>(null)

    createEffect(() => {
      queryFutureElement('.navbar-avatar').then(el => {
        setUserDisplayName((el as HTMLImageElement).title)
        setUserName((el as HTMLImageElement).title.toLowerCase())
        setUserId((el as HTMLImageElement).src.match(/\/(\d+)$/)?.[1] ?? null!)
      })
    })

    return {userDisplayName, userName, userId}
  } else {
    // return {userDisplayName, userName, userId}
  }
}
