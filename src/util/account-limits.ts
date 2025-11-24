import {EmoteProvider} from './emote-context'
import {useCurrentChannelContext} from './track-current-channel'
import {
  createAccountMeta as createBTTVAccountMeta,
  createDashboardMeta as createBTTVDashboardMeta
} from './bttv-dashboard-meta'
import {createAccountMeta as createFFZAccountMeta} from './ffz-user-meta'
import {createMemo} from 'solid-js'
import {createChannelInfo} from './channel'

export function createAccountEmoteLimitInfo(provider: EmoteProvider) {
  const currentChannelContext = useCurrentChannelContext()
  const {id: channelId} = createChannelInfo(provider, currentChannelContext.knownInfo)
  if (provider === EmoteProvider.BTTV) {
    const account = createBTTVAccountMeta()
    const dashboards = createBTTVDashboardMeta()
    return createMemo(() => {
      return [account(), ...dashboards() ?? []].find(info => info && info.providerId === channelId())?.limits.liveEmotes ?? null
    })
  } else if (provider === EmoteProvider.FFZ) {
    const ffzKnownInfo = createMemo(() =>
      channelId() ? ({id: channelId()} as { id: string }) : undefined
    )
    const account = createFFZAccountMeta(ffzKnownInfo)
    return createMemo(() => account()?.user.max_emoticons ?? null)
  } else {
    return createMemo(() => null)
  }
}
