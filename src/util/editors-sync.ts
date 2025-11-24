import {Accessor, createEffect} from 'solid-js'
import {authFetch} from './auth-fetch'

export interface BTTVEditorData {
  id: string
  name: string
  displayName: string
  providerId: string
  avatar: string
}

export function createEditorsSync(channelId: Accessor<string | null>) {
  createEffect(async () => {
    if (!!channelId()) return
    if (sessionStorage.getItem('tfb-synced-editors') || !channelId()) return
    const authHeader = {headers: {Authorization: `Bearer ${localStorage.getItem('USER_TOKEN')?.replaceAll('"', '')}`}}
    const editorsData = await fetch('https://api.betterttv.net/3/account/editors', authHeader).then(res => res.json() as Promise<BTTVEditorData[]>)
    await authFetch(`https://${API_HOST}/channel/${channelId()}/editors`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(editorsData.map(user => user.providerId))
    })
    sessionStorage.setItem('tfb-synced-editors', 'true')
  })
}
