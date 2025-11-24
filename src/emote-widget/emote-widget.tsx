import {createEffect, For, onMount, Show} from 'solid-js'
import cn from 'classnames'
import {extName} from '../variables'
import {EmoteProvider} from '../util/emote-context'
import {createChannelInfo} from '../util/channel'
import {createEditorsSync} from '../util/editors-sync'
import {DuplicatesPanel} from '../panel/duplicates-panel'
import {UsagePanel} from '../panel/usage-panel'
import {NotesPanel} from '../panel/notes-panel'
import {SeasonalPanel} from '../panel/seasonal-panel'
import {useCurrentChannelContext} from '../util/track-current-channel'
import {clientSettings} from '../client-settings'
import {Spinner} from '../spinner'

import dashWidgetStyles from '../dash-widget/dash-widget.module.scss'
import widgetStyles from './emote-widget.module.scss'

export interface EmoteWidgetData {
  emoteName: string,
  emoteId: string,
  panelClass: string,
  sectionClass: string,
  sectionClassName: string
  headingClass?: string
  channelNames?: string[],
  halfWidth?: boolean,
}

export function EmoteWidget(props: { provider: EmoteProvider, data: EmoteWidgetData }) {
  const currentChannelContext = useCurrentChannelContext()
  const {id: channelId, displayName: channelDisplayName} =
    createChannelInfo(props.provider, currentChannelContext.knownInfo)

  if (props.provider === EmoteProvider.BTTV) {
    createEditorsSync(channelId)
  } else if (props.provider === EmoteProvider.FFZ) {
    onMount(() => {
      const selected = clientSettings.get('ffz-selected-channel')
      if (selected) currentChannelContext.setName?.(selected)
    })
  }

  return (<>
    <div
      class={cn(widgetStyles.col, widgetStyles[props.provider.toLowerCase()], dashWidgetStyles[props.provider.toLowerCase()])}>
      <div class={widgetStyles.head}>
        <p class={dashWidgetStyles.title}>{extName}</p>
        <Show
          when={props.provider === EmoteProvider.FFZ && (props.data.channelNames && props.data.channelNames?.length > 1)}>
          <div class={cn('dropdown')}>
            <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-expanded="false">
              {channelDisplayName()} <span class="caret"></span>
            </a>
            <ul class="dropdown-menu">
              <For each={props.data.channelNames}>{channelName => (
                <li><a href={`#`} onClick={(e) => {
                  e.preventDefault()
                  currentChannelContext.setName?.(channelName.toLowerCase())
                  clientSettings.set('ffz-selected-channel', channelName.toLowerCase())
                }}>
                  {channelName}
                </a></li>
              )}</For>
            </ul>
          </div>
        </Show>
      </div>
      <Show when={channelId()} fallback={<Spinner centered/>}>
        <div
          class={cn(widgetStyles.emoteRow, props.data.halfWidth && widgetStyles.halfWidth, widgetStyles[props.provider.toLowerCase()])}>
          <Show when={props.provider !== EmoteProvider.FFZ}>
            <DuplicatesPanel provider={props.provider} {...props.data} />
          </Show>
          <SeasonalPanel provider={props.provider} {...props.data} />
          <UsagePanel provider={props.provider} {...props.data} />
          <NotesPanel provider={props.provider} {...props.data} />
        </div>
      </Show>
    </div>
  </>)
}
