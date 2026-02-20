import {Accessor, createEffect, createMemo, For, Show} from 'solid-js'
import {reconcile, SetStoreFunction} from 'solid-js/store'
import cn from 'classnames'
import {Emote} from './seasonal-query'
import {EmoteProvider} from '../../util/emote-context'
import {EmoteReplacement} from './emote-replacement'
import Sp from '../../util/space'
import {ApplyModalProps, ApplyModalType} from './apply-modal'

import styles from './apply-modal.module.scss'
import seasonalPanelStyle from '../seasonal-panel.module.scss'

interface ApplyModalSelectPageProps extends ApplyModalProps {
  filteredEmotes: Accessor<{
    applicableEmotes: [Emote, Emote][]
    unapplicableEmotes: [Emote, Emote][]
    differentProviderEmotes: [Emote, Emote][]
  }>
  freeSlots: Accessor<number>
  freeSlotsAfterApply: Accessor<number>
  unapplicableUncheckable: Accessor<boolean>
  applyEmotes: Record<string, boolean>
  setApplyEmotes: SetStoreFunction<Record<string, boolean>>
  confirm: () => void | Promise<void>
}

export function ApplyModalSelectPage(props: ApplyModalSelectPageProps) {
  function setType(value: ApplyModalType) {
    props.signals.setType(value)
    props.setApplyEmotes(reconcile({}))
  }

  const buttonDisabled = createMemo(() => {
    return props.filteredEmotes().applicableEmotes
      .concat(props.filteredEmotes().unapplicableEmotes)
      .filter(([emote]) => props.applyEmotes[emote.providerId])
      .length == 0
  })

  return (<>
    <fieldset class={styles.segmented}>
      <label class={styles.label}>
        <span>Apply</span>
        <input type={'radio'} checked={props.signals.type() === ApplyModalType.Apply}
               onChange={() => setType(ApplyModalType.Apply)} />
      </label>
      <label class={styles.label}>
        <span>Unapply</span>
        <input type={'radio'} checked={props.signals.type() === ApplyModalType.Unapply}
               onChange={() => setType(ApplyModalType.Unapply)} />
      </label>
    </fieldset>
    <small>
      <span>{props.currentGroup()?.emotes.length} emotes in group</span>
      <Show when={props.filteredEmotes().applicableEmotes.length < (props.currentGroup()?.emotes.length ?? 0)}>
        , {props.filteredEmotes()?.applicableEmotes.length} can be switched
      </Show>
    </small>
    <Show when={props.filteredEmotes()?.unapplicableEmotes.length > 0}>
      <small>
        <span>{props.filteredEmotes().unapplicableEmotes.length} are not added to the channel</span>
        <Show when={props.freeSlots() > 0}>
            <span>
              , but their
              <Show when={props.signals.type() === ApplyModalType.Apply}><Sp />seasonal alternatives</Show>
              <Show when={props.signals.type() === ApplyModalType.Unapply}><Sp />associated non-seasonal emotes</Show>
              <Sp />can be added from the group.
              Select which ones below. [{props.freeSlots() - props.freeSlotsAfterApply()}/{props.freeSlots()} free slots will be filled]
            </span>
        </Show>
      </small>
    </Show>
    <Show when={props.filteredEmotes().differentProviderEmotes.length > 0}>
      <small>
        There are emotes of other providers ({props.provider === EmoteProvider.BTTV ? 'FFZ' : 'BTTV'}) in this
        group. Go to the respective site(s) to apply them there.
      </small>
    </Show>
    <div class={seasonalPanelStyle.emoteReplacementList}>
      <For each={
        props.filteredEmotes().unapplicableEmotes
          .toSorted(([a], [b]) => a.code.localeCompare(b.code))
      }>{pair =>
        <EmoteReplacement pair={pair} mode={props.signals.type()} unapplicable={'Not in channel'}
                          uncheckable={props.unapplicableUncheckable}
                          applyEmotes={props.applyEmotes} setApplyEmotes={props.setApplyEmotes} />
      }</For>
      <For each={
        props.filteredEmotes().applicableEmotes
          .toSorted(([a], [b]) => a.code.localeCompare(b.code))
      }>{pair =>
        <EmoteReplacement pair={pair} mode={props.signals.type()}
                          applyEmotes={props.applyEmotes} setApplyEmotes={props.setApplyEmotes} />
      }</For>
    </div>
    <button class={cn(seasonalPanelStyle.button, seasonalPanelStyle.primary)} disabled={buttonDisabled()}
            onClick={props.confirm}>
      <Show when={props.signals.type() === ApplyModalType.Apply}>Apply Emotes</Show>
      <Show when={props.signals.type() === ApplyModalType.Unapply}>Unapply Emotes</Show>
    </button>
  </>)
}
