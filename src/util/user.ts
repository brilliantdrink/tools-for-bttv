import {createEffect, createSignal} from 'solid-js'
import {EmoteProvider} from './emote-context'
import {BTTVgetUser} from './bttv-emotes'
import {queryFutureElement} from './future-element'

export function useUser(provider: EmoteProvider) {
  const [userDisplayName, setUserDisplayName] = createSignal<string>(null!)
  const [userName, setUserName] = createSignal<string>(null!)
  const [userId, setUserId] = createSignal<string>(null!)

  createEffect(() => {
    if (provider === EmoteProvider.BTTV) {
      BTTVgetUser().then(user => {
        setUserDisplayName(user.displayName)
        setUserName(user.name)
        setUserId(user.providerId)
      })
    } else if (provider === EmoteProvider.FFZ) {
      queryFutureElement('.navbar-avatar').then(el => {
        setUserDisplayName((el as HTMLImageElement).title)
        setUserName((el as HTMLImageElement).title.toLowerCase())
        setUserId((el as HTMLImageElement).src.match(/\/(\d+)$/)?.[1] ?? null!)
      })
    }
  })

  return {userDisplayName, userName, userId}
}
