import {Accessor, createMemo, For, Show} from 'solid-js'
import cn from 'classnames'
import {EmoteProvider, useEmotes} from '../util/emote-context'
import {EmoteCard} from '../emote-card'

import dashWidgetStyles from '../dash-widget/dash-widget.module.scss'
import widgetStyles from './emote-widget.module.scss'

export default function DuplicatesList(props: {
  channelId: Accessor<string>,
  provider: EmoteProvider,
  emoteName: string,
  emoteId: string,
  sectionClass?: string
}) {
  const {emotes} = useEmotes(props.channelId)

  const overlapping = createMemo(() => emotes()?.filter(emote =>
    emote.id !== props.emoteId && emote.code === props.emoteName
  ))
  const likelyDupes = createMemo(() => emotes()?.filter(emote =>
    emote.id !== props.emoteId && emote.code !== props.emoteName && emote.code.toUpperCase() === props.emoteName.toUpperCase()
  ))

  // todo: show loading

  return <>
    <div class={cn(
      widgetStyles.col,
      props.provider === EmoteProvider.FFZ && dashWidgetStyles.ffz,
      'chakra-stack',
      props.sectionClass
    )}>
      <Show when={((overlapping()?.length ?? 0) + (likelyDupes()?.length ?? 0)) === 0}>
        <p class={cn(widgetStyles.subHeader, props.provider === EmoteProvider.FFZ && widgetStyles.ffzSubHeader)}>
          This emote doesn't overlap with others in this channel.
        </p>
      </Show>
      <Show when={overlapping()?.length ?? 0 > 0}>
        <p class={cn(widgetStyles.subHeader, props.provider === EmoteProvider.FFZ && widgetStyles.ffzSubHeader)}>
          Overlapping
        </p>
        <div class={widgetStyles.emoteList}>
          <For each={overlapping()}>
            {emote => <EmoteCard emote={emote} provider={props.provider} />}
          </For>
        </div>
      </Show>
      <Show when={likelyDupes()?.length ?? 0 > 0}>
        <p class={cn(widgetStyles.subHeader, props.provider === EmoteProvider.FFZ && widgetStyles.ffzSubHeader)}>
          Likely duplicate
        </p>
        <div class={widgetStyles.emoteList}>
          <For each={likelyDupes()}>
            {emote => <EmoteCard emote={emote} provider={props.provider} />}
          </For>
        </div>
      </Show>
    </div>
  </>
}
