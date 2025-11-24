import {For, Show, Suspense} from 'solid-js'
import cn from 'classnames'
import {EmoteProvider} from '../util/emote-context'
import {createChannelInfo} from '../util/channel'
import BttvPanel from './panel'
import DuplicatesList from '../emote-widget/duplicates-list'
import {useCurrentChannelContext} from '../util/track-current-channel'
import {Spinner} from '../spinner'

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
  const currentChannelContext = useCurrentChannelContext()
  const {id: channelId} =
    createChannelInfo(props.provider, currentChannelContext.knownInfo)

  return (
    <BttvPanel panelClass={cn(props.panelClass)}
               sectionClass={cn(props.sectionClass, emoteUsageStyles.sectionChart)}
               headingClass={cn(props.headingClass)}
               provider={props.provider} title={'Duplicates in Channel'}>
      <Suspense fallback={<Spinner centered />}>
        <Show when={props.channelNames}>
          <For each={props.channelNames}>
            {(channelName, index) => {
              const {id: channelId} = createChannelInfo(props.provider, () => ({name: channelName}))
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
      </Suspense>
    </BttvPanel>
  )
}
