import {Accessor, createEffect, createMemo, createSignal, Show} from 'solid-js'
import {createStore} from 'solid-js/store'
import cn from 'classnames'
import Modal from '../../modal'
import {Emote, EmoteGroup} from './seasonal-query'
import {EmoteProvider, useEmotes} from '../../util/emote-context'
import {createAccountEmoteLimitInfo} from '../../util/account-limits'
import {createChannelInfo} from '../../util/channel'
import {runApplyModalProcessing} from './apply-modal-processing'
import seasonalPanelStyle from '../seasonal-panel.module.scss'
import {ApplyModalSelectPage} from './apply-modal-select-page'
import {ApplyModalProcessPage} from './apply-modal-process-page'

export enum ApplyModalType {
  Apply = 'Apply',
  Unapply = 'Unapply',
}

export function createApplyModalSignals() {
  const [open, setOpen] = createSignal(false)
  const [type, setType] = createSignal(ApplyModalType.Apply)
  return {open, setOpen, type, setType}
}

export interface ApplyModalProps {
  provider: EmoteProvider
  signals: ReturnType<typeof createApplyModalSignals>
  currentGroup: Accessor<EmoteGroup | null>
  channelId: Accessor<string | null>
}

export function ApplyModal(props: ApplyModalProps) {
  const [page, setPage] = createSignal<'select' | 'process'>('select')
  const {emotes} = useEmotes(props.channelId)
  const info = createChannelInfo(props.provider, () => ({id: props.channelId()}))
  const providerUserLibraryEmotes = createMemo(() => {
    return emotes()?.filter(emote => emote.provider === props.provider && !emote.global)
  })
  const filteredEmotes = createMemo(() => {
    const applicableEmotes: [Emote, Emote][] = [],
      unapplicableEmotes: [Emote, Emote][] = [],
      differentProviderEmotes: [Emote, Emote][] = []
    const groupEmotes = props.currentGroup()?.emotes
    if (!groupEmotes) return {applicableEmotes, unapplicableEmotes, differentProviderEmotes}
    for (const pair of groupEmotes) {
      const [targetEmote, altEmote] = pair
      let groupEmote: Emote = null!
      if (props.signals.type() === ApplyModalType.Apply) {
        groupEmote = targetEmote
      } else if (props.signals.type() === ApplyModalType.Unapply) {
        groupEmote = altEmote
      }
      if (groupEmote.provider.toUpperCase() as EmoteProvider === props.provider) {
        if (providerUserLibraryEmotes()?.some(emote => emote.id.toString() === groupEmote.providerId)) {
          applicableEmotes.push(pair)
        } else {
          unapplicableEmotes.push(pair)
        }
      } else {
        differentProviderEmotes.push(pair)
      }
    }
    return {applicableEmotes, unapplicableEmotes, differentProviderEmotes}
  })
  const maxEmotes = createAccountEmoteLimitInfo(props.provider)
  const freeSlots = createMemo(() => Math.max(0, (maxEmotes() ?? 0) - (providerUserLibraryEmotes()?.length ?? 0)))
  const [applyEmotes, setApplyEmotes] = createStore<Record<string, boolean>>({})
  const freeSlotsAfterApply = createMemo(() => {
    let appliedUnapplicableEmotes = 0
    for (const [emote] of filteredEmotes().unapplicableEmotes) {
      if (!applyEmotes[emote.providerId]) continue
      appliedUnapplicableEmotes++
    }
    return freeSlots() - appliedUnapplicableEmotes
  })
  const unapplicableUncheckable = createMemo(() => freeSlotsAfterApply() <= 0)

  createEffect(() => {
    if (!props.signals.open()) {
      setTimeout(() => {
        setPage('select')
        setOperations(0)
        setOperationsDone(0)
        setCurrentStep('')
        setIsDone(false)
      }, 300)
    }
  })

  const [operations, setOperations] = createSignal(0)
  const [operationsDone, setOperationsDone] = createSignal(0)
  const [currentStep, setCurrentStep] = createSignal('')
  const [isDone, setIsDone] = createSignal(false)
  const [shouldStop, setShouldStop] = createSignal(false)
  const [errors, setErrors] = createSignal<string[]>([])

  async function confirm() {
    await runApplyModalProcessing({
      provider: props.provider, direction: props.signals.type(),
      info, setPage, filteredEmotes, applyEmotes,
      shouldStop, setCurrentStep, setErrors, setOperations, setOperationsDone, setIsDone
    })
  }

  return (
    <Modal class={cn(seasonalPanelStyle.modal)} open={props.signals.open} setOpen={props.signals.setOpen}
           closeOnOverlayClick={false} provider={props.provider}>
      <p class={seasonalPanelStyle.heading}>Apply / Unapply Seasonal Emotes</p>
      <p>from group "{props.currentGroup()?.name}"</p>
      <Show when={page() === 'select'}>
        <ApplyModalSelectPage {...props} {...{
          filteredEmotes, freeSlots, freeSlotsAfterApply, unapplicableUncheckable,
          applyEmotes, setApplyEmotes, confirm,
        }} />
      </Show>
      <Show when={page() == 'process'}>
        <ApplyModalProcessPage {...props} {...{
          operations, operationsDone, shouldStop, errors, isDone, currentStep, setShouldStop
        }} />
      </Show>
    </Modal>
  )
}
