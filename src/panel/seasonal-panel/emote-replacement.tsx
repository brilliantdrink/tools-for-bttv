import {Accessor, createMemo, Show} from 'solid-js'
import {SetStoreFunction} from 'solid-js/store'
import cn from 'classnames'
import {FaSolidArrowRight, FaSolidPlus} from 'solid-icons/fa'
import {TbSlash} from 'solid-icons/tb'
import {EmoteCard} from '../../emote-card'
import {Checkbox} from '../../checkbox'
import {Emote} from './seasonal-query'
import {EmoteProvider} from '../../util/emote-context'
import {ApplyModalType} from './apply-modal'

import styles from './apply-modal.module.scss'

export function EmoteReplacement(props: {
  applyEmotes: Record<string, boolean>
  setApplyEmotes: SetStoreFunction<Record<string, boolean>>
  pair: [Emote, Emote],
  direction: ApplyModalType.Apply | ApplyModalType.Unapply
  unapplicable?: boolean
  uncheckable?: Accessor<boolean>
}) {
  const checked = createMemo(() => props.applyEmotes[props.pair[0].providerId] ?? !props.unapplicable)
  const emotesName = createMemo(() => props.pair[0].code)
  const existingEmote = createMemo(() => props.direction === ApplyModalType.Apply ? props.pair[0] : props.pair[1])
  const newEmote = createMemo(() => props.direction === ApplyModalType.Apply ? props.pair[1] : props.pair[0])
  return (
    <div class={cn(styles.applyItem)}>
      <Checkbox class={styles.check} checked={checked} setChecked={arg => {
        const newValue = typeof arg === 'function' ? arg(checked()) : arg
        if (props.uncheckable?.() && newValue) return
        props.setApplyEmotes(props.pair[0].providerId, newValue)
      }} />
      <EmoteCard class={cn(props.unapplicable && styles.missing, styles.emote)} showProvider={false} onClick={() => 0}
                 emote={{
                   id: existingEmote().providerId,
                   code: emotesName(),
                   provider: existingEmote().provider.toUpperCase() as EmoteProvider
                 }} />
      <div class={styles.arrow}>
        <FaSolidArrowRight />
        <Show when={!checked()}>
          <TbSlash class={styles.scale} />
        </Show>
        <Show when={checked() && props.unapplicable}>
          <FaSolidPlus class={cn(styles.sub, styles.asShadow)} />
          <FaSolidPlus class={styles.sub} />
        </Show>
      </div>
      <EmoteCard class={styles.emote} onClick={() => 0} showProvider={false} emote={{
        id: newEmote().providerId,
        code: emotesName(),
        provider: newEmote().provider.toUpperCase() as EmoteProvider
      }} />
    </div>
  )
}
