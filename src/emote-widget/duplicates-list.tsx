import {Accessor, createEffect, createMemo, For, Show} from 'solid-js'
import cn from 'classnames'
import {EmoteProvider, useEmotes} from '../util/emote-context'
import {EmoteCard} from '../emote-card'

import dashWidgetStyles from '../dash-widget/dash-widget.module.scss'
import widgetStyles from './emote-widget.module.scss'

export default function DuplicatesList(props: {
  channelId: Accessor<string | null>,
  provider: EmoteProvider,
  emoteName: string,
  emoteId: string,
  sectionClass?: string
}) {
  const {emotes} = useEmotes(props.channelId)

  createEffect(() => {
    console.log(emotes(), props.emoteId)
  })

  const overlapping = createMemo(() => emotes()?.filter(emote =>
    String(emote.id) !== String(props.emoteId) && emote.code === props.emoteName
  ))
  const likelyDupes = createMemo(() => emotes()?.filter(emote =>
    String(emote.id) !== String(props.emoteId) && emote.code !== props.emoteName && emote.code.toUpperCase() === props.emoteName.toUpperCase()
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
          Exact name match
        </p>
        <div class={widgetStyles.emoteList}>
          <For each={overlapping()}>
            {emote => <EmoteCard emote={emote} />}
          </For>
        </div>
      </Show>
      <Show when={likelyDupes()?.length ?? 0 > 0}>
        <p class={cn(widgetStyles.subHeader, props.provider === EmoteProvider.FFZ && widgetStyles.ffzSubHeader)}>
          Non-exact name match
        </p>
        <div class={widgetStyles.emoteList}>
          <For each={likelyDupes()}>
            {emote => <EmoteCard emote={emote} />}
          </For>
        </div>
      </Show>
    </div>
  </>
}
