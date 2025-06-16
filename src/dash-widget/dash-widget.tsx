import {For} from 'solid-js'
import cn from 'classnames'
import {extName} from '../variables'
import {EmoteProvider, useEmotes} from '../util/emote-context'
import {useChannel} from '../util/channel'
import {EmoteListDetails} from './emote-list'
import {EmoteCard} from '../emote-card'
import {createEditorsSync} from '../util/editors-sync'

import widgetStyles from './dash-widget.module.scss'
import emoteCardStyles from '../emote-card.module.scss'

export function DashWidget(props: { provider: EmoteProvider }) {
  const {channelId} = useChannel(props.provider)
  const {overlapping, likelyDuplicates} = useEmotes(channelId)
  if (props.provider === EmoteProvider.BTTV) createEditorsSync(channelId)

  return (<>
    <div class={cn(
      widgetStyles[props.provider.toLowerCase()],
      props.provider === EmoteProvider.FFZ && 'panel panel-default'
    )} id={widgetStyles.bttvFfzHelper}>
      <p class={cn(
        props.provider === EmoteProvider.BTTV && widgetStyles.title,
        props.provider === EmoteProvider.FFZ && 'panel-heading'
      )}>
        {extName}
      </p>
      <EmoteListDetails title={'Overlapping emote names'} loading={() => !overlapping()}
                        amount={overlapping()?.length}
                        detailsClass={cn(props.provider === EmoteProvider.FFZ && widgetStyles.ffzDetails)}>
        <div class={widgetStyles.emotesPairContainer}>
          <For each={overlapping()}>
            {(emotes) => (
              <div class={emoteCardStyles.emotesContainer}>
                <EmoteCard emote={emotes[0]} provider={props.provider} />
                <EmoteCard emote={emotes[1]} provider={props.provider} />
              </div>
            )}
          </For>
        </div>
      </EmoteListDetails>
      <EmoteListDetails title={'Likely duplicates'} loading={() => !likelyDuplicates()}
                        amount={likelyDuplicates()?.length}
                        detailsClass={cn(props.provider === EmoteProvider.FFZ && widgetStyles.ffzDetails)}>
        <div class={widgetStyles.emotesPairContainer}>
          <For each={likelyDuplicates()}>
            {(emotes) => (
              <div class={emoteCardStyles.emotesContainer}>
                <EmoteCard emote={emotes[0]} provider={props.provider} />
                <EmoteCard emote={emotes[1]} provider={props.provider} />
              </div>
            )}
          </For>
        </div>
      </EmoteListDetails>
    </div>
  </>)
}
