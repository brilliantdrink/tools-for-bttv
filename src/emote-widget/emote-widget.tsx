import cn from 'classnames'
import {extName} from '../variables'
import {EmoteProvider} from '../util/emote-context'
import {createChannelState} from '../util/channel'
import {createEditorsSync} from '../util/editors-sync'

import dashWidgetStyles from '../dash-widget/dash-widget.module.scss'
import widgetStyles from './emote-widget.module.scss'
import {DuplicatesPanel} from '../panel/duplicates-panel'
import {UsagePanel} from '../panel/usage-panel'
import {NotesPanel} from '../panel/notes-panel'
import {For, Show} from 'solid-js'

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
  // todo this should be a context instead of passing it down like a tshirt with holes under the arms given to the younger sibling
  // todo if i come here from user a it should be that user still instead of the logged in user b
  const {
    channelId,
    channelDisplayName,
    setChannelName
  } = createChannelState(props.provider, props.provider === EmoteProvider.BTTV)
  if (props.provider === EmoteProvider.BTTV) createEditorsSync(channelId)

  return (<>
    <div class={cn(widgetStyles.col, widgetStyles[props.provider.toLowerCase()])}>
      <div class={widgetStyles.head}>
        <p class={dashWidgetStyles.title}>{extName}</p>
        <Show when={props.provider === EmoteProvider.FFZ && (props.data.channelNames && props.data.channelNames?.length > 1)}>
          <div class={cn('dropdown')}>
            <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-expanded="false">
              {channelDisplayName()} <span class="caret"></span>
            </a>
            <ul class="dropdown-menu">
              <For each={props.data.channelNames}>{channelName => (
                <li><a href={`#`} onClick={(e) => {
                  e.preventDefault()
                  setChannelName?.(channelName.toLowerCase())
                }}>
                  {channelName}
                </a></li>
              )}</For>
            </ul>
          </div>
        </Show>
      </div>
      <div
        class={cn(widgetStyles.emoteRow, props.data.halfWidth && widgetStyles.halfWidth, widgetStyles[props.provider.toLowerCase()])}>
        <Show when={props.provider !== EmoteProvider.FFZ}>
          <DuplicatesPanel provider={props.provider} {...props.data} />
        </Show>
        <UsagePanel provider={props.provider} {...props.data} channelId={channelId} />
        <NotesPanel provider={props.provider} {...props.data} channelId={channelId} channelDisplayName={channelDisplayName} />
      </div>
    </div>
  </>)
}
