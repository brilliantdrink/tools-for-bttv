import {createMemo, onMount} from 'solid-js'
import cn from 'classnames'
import {EmoteProvider} from './util/emote-context'
import {Export} from './panel/seasonal-panel/seasonal-list-item'
import {createTransferModalSignals, TransferModal, TransferModalType} from './panel/seasonal-panel/transfer-modal'
import {useCurrentChannelContext} from './util/track-current-channel'
import {createChannelInfo} from './util/channel'
import {createEmoteSetMeta} from './util/bttv-dashboard-meta'
import {Emote, EmoteGroup} from './panel/seasonal-panel/seasonal-query'
import {bttvFormatEmoteToToolsEmote} from './variables'

import styles from './emote-set-widget.module.scss'
import tooltipStyles from './tooltip.module.scss'

export function EmoteSetWidget(props: { provider: EmoteProvider, set: { id: any, name: string } }) {
  const currentChannelContext = useCurrentChannelContext()
  const {id: channelId} = createChannelInfo(props.provider, currentChannelContext.knownInfo)
  const modalSignals = createTransferModalSignals()
  onMount(() => {
    modalSignals.setType(TransferModalType.Export)
  })
  const setMeta = createEmoteSetMeta(props.set.id)
  const currentSet = createMemo<Omit<EmoteGroup, 'emotes'> & { id: any, emotes: [false, Emote][] }>(() => ({
    id: props.set.id,
    name: props.set.name,
    emotes: (setMeta()?.sharedEmotes ?? []).map((data) => {
      const emote = bttvFormatEmoteToToolsEmote(data)
      return [false, {
        code: emote.code,
        providerId: emote.id,
        provider: props.provider.toLowerCase() as 'bttv' | 'ffz'
      }]
    }),
  }))

  if (props.provider !== 'BTTV') return null

  return (<>
    <button class={cn(styles.button, styles[props.provider.toLowerCase()], tooltipStyles.trigger)} onClick={() => {
      modalSignals.setOpen(true)
    }}>
      <Export />
      <div class={cn(styles.tooltip, tooltipStyles.tooltip)}>
        Transfer emotes from this set to seasonal group
      </div>
    </button>
    <TransferModal channelId={channelId} signals={modalSignals} provider={props.provider}
                   currentGroup={currentSet} />
  </>)
}
