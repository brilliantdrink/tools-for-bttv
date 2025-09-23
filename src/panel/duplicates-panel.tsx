import {createSignal, For, Show} from 'solid-js'
import cn from 'classnames'
import {EmoteProvider} from '../util/emote-context'
import {createChannelState} from '../util/channel'
import BttvPanel from './panel'
import DuplicatesList from '../emote-widget/duplicates-list'
import {BTTVgetChannelId} from '../util/bttv-emotes'
import {FFZgetChannelId} from '../util/ffz-emotes'

import widgetStyles from '../emote-widget/emote-widget.module.scss'
import emoteUsageStyles from '../emote-widget/emote-usage.module.scss'
import panelStyles from './panel.module.scss'

interface DuplicatesPanelProps {
  provider: EmoteProvider,
  panelClass?: string
  sectionClass?: string
  headingClass?: string
  channelNames?: string[]
  emoteName: string
  emoteId: string
}

export function DuplicatesPanel(props: DuplicatesPanelProps) {
  const {channelId} = createChannelState(props.provider)

  return (
    <BttvPanel panelClass={cn(props.panelClass, widgetStyles.twoWide)}
               sectionClass={cn(props.sectionClass, emoteUsageStyles.sectionChart)}
               headingClass={cn(props.headingClass)}
               provider={props.provider} title={'Duplicates in Channel'}>
      <Show when={props.channelNames}>
        <For each={props.channelNames}>
          {(channelName, index) => {
            const [channelId, setChannelId] = createSignal<string>(null!)
            let getChannelId = null
            if (props.provider === EmoteProvider.BTTV) getChannelId = BTTVgetChannelId
            else if (props.provider === EmoteProvider.FFZ) getChannelId = FFZgetChannelId
            if (!getChannelId) return
            getChannelId(channelName).then(setChannelId)
            return (<>
              <p class={cn(panelStyles.sectionHeading)}>{channelName}</p>
              <DuplicatesList channelId={channelId} provider={props.provider}
                              emoteName={props.emoteName} emoteId={props.emoteId} />
              <Show when={index() !== ((props.channelNames?.length ?? 0) - 1)}>
                <hr class={cn('chakra-divider', props.provider === EmoteProvider.FFZ && widgetStyles.ffzDivider)} />
              </Show>
            </>)
          }}
        </For>
      </Show>
      <Show when={!props.channelNames}>
        <DuplicatesList channelId={channelId} provider={props.provider}
                        emoteName={props.emoteName} emoteId={props.emoteId} />
      </Show>
    </BttvPanel>
  )
}
