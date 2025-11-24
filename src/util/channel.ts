import {Accessor, createMemo} from 'solid-js'
import {EmoteProvider} from './emote-context'
import {
  BTTVAccountData,
  BTTVDashboardData,
  createAccountMeta as createBTTVAccountMeta,
  createDashboardMeta as createBTTVDashboardMeta
} from './bttv-dashboard-meta'
import {createAccountMeta as createFFZAccountMeta} from './ffz-user-meta'
import {PickOneOnly} from './type'

interface ChannelInfo {
  id: Accessor<string | null>
  name: Accessor<string | null>
  displayName: Accessor<string | null>
}

export function createChannelInfo<P extends EmoteProvider>(provider: P, knownInfo?: Accessor<PickOneOnly<{
  id: string | null,
  emoteProviderId: string | null,
  name: string | null,
}>>): ChannelInfo & (P extends EmoteProvider.BTTV
  ? { bttvId: Accessor<string | null> }
  : (P extends EmoteProvider.FFZ
    ? { ffzId: Accessor<string | null> }
    : never)
  ) {
  if (provider === EmoteProvider.BTTV) {
    const account = createBTTVAccountMeta()
    const dashboards = createBTTVDashboardMeta()

    const channel = createMemo(() => {
      let accountData: undefined | BTTVAccountData | BTTVDashboardData
      const knownInfoValue = knownInfo?.()
      if (!knownInfoValue) {
        accountData = account()
      } else {
        const infoKey = Object.keys(knownInfoValue)[0] as keyof typeof knownInfoValue
        let value = knownInfoValue[infoKey]
        if (!value) return undefined
        if (infoKey === 'name') value = value.toLowerCase()
        let accountKey: keyof (BTTVAccountData | BTTVDashboardData)
        if (infoKey === 'id') accountKey = 'providerId'
        else if (infoKey === 'emoteProviderId') accountKey = 'id'
        else if (infoKey === 'name') accountKey = 'name'
        else return undefined
        accountData = [account(), ...dashboards() ?? []].filter(v => !!v)
          .find(info => info[accountKey] === value)
      }
      return accountData
    })
    const id = createMemo(() => channel()?.providerId ?? null)
    const name = createMemo(() => channel()?.name ?? null)
    const displayName = createMemo(() => channel()?.displayName ?? null)
    const bttvId = createMemo(() => channel()?.id ?? null)

    // @ts-ignore
    return {id, name, displayName, bttvId}
  } else if (provider === EmoteProvider.FFZ) {
    const ffzKnownInfo = createMemo<ReturnType<Parameters<typeof createFFZAccountMeta>[0]> | undefined>(() => {
      const knownInfoValue = knownInfo?.()
      if (!knownInfoValue) {
        const avatar = document.querySelector('img.navbar-avatar') as null | HTMLImageElement
        if (avatar) return {name: avatar.title}
      } else {
        if ('id' in knownInfoValue && knownInfoValue.id) return {id: knownInfoValue.id}
        else if ('emoteProviderId' in knownInfoValue && knownInfoValue.emoteProviderId) return {ffzId: knownInfoValue.emoteProviderId}
        else if ('name' in knownInfoValue && knownInfoValue.name) return {name: knownInfoValue.name}
      }
    })
    const account = createFFZAccountMeta(ffzKnownInfo)
    const id = createMemo(() => account()?.user.twitch_id.toString() ?? null)
    const name = createMemo(() => account()?.user.name ?? null)
    const displayName = createMemo(() => account()?.user.display_name ?? null)
    const ffzId = createMemo(() => account()?.user.id.toString() ?? null)

    // @ts-ignore
    return {id, name, displayName, ffzId}
  } else {
    // @ts-ignore
    return {id: () => null, name: () => null, displayName: () => null}
  }
}
