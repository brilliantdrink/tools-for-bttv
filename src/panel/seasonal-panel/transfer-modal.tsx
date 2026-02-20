import {Accessor, createEffect, createMemo, createSignal, For, on, onMount, Show} from 'solid-js'
import cloneDeep from 'lodash.clonedeep'
import cn from 'classnames'
import {IoChevronDown} from 'solid-icons/io'
import {createStore, reconcile} from 'solid-js/store'
import {CreateSelectValue, Select} from '@thisbeyond/solid-select'
import "@thisbeyond/solid-select/style.css";
import Modal from '../../modal'
import {createSeasonalGroupsResource, Emote} from './seasonal-query'
import {Spinner} from '../../spinner'
import {EmoteData, EmoteProvider, useEmotes} from '../../util/emote-context'
import {createChannelInfo} from '../../util/channel'
import {
  createAccountMeta as createBTTVAccountMeta,
  createDashboardMeta as createBTTVDashboardMeta
} from '../../util/bttv-dashboard-meta'
import {createAccountMeta as createFFZAccountMeta} from '../../util/ffz-user-meta'
import {EmoteReplacement} from './emote-replacement'
import {createGroupedOptions, EmoteGroupWithParentName} from './create-grouped-options'
import {createEmoteModalSignals, EmoteModal, EmoteModalType} from './emote-modal'
import {authFetch} from '../../util/auth-fetch'
import error, {ErrorType} from '../../util/error'

import seasonalPanelStyle from '../seasonal-panel.module.scss'

export enum TransferModalType {
  Import = 'Import',
  Export = 'Export',
}

export function createTransferModalSignals() {
  const [open, setOpen] = createSignal(false)
  const [type, setType] = createSignal(TransferModalType.Import)
  const [loading, setLoading] = createSignal(false)
  return {
    open, setOpen,
    type, setType,
    loading, setLoading,
  }
}

interface GroupModalProps {
  channelId: Accessor<string | null>
  signals: ReturnType<typeof createTransferModalSignals>
  currentGroup: Accessor<Omit<EmoteGroupWithParentName, 'group' | 'groupId'>>
  seasonalGroups?: ReturnType<typeof createSeasonalGroupsResource>,
  provider: EmoteProvider
  channelNames?: string[]
}

const channelNameFromGroup = (groupName: string | undefined) =>
  groupName?.replace('By ', '').replace('From ', '')

export function TransferModal(props: GroupModalProps) {
  const knownChannelInfo = createMemo(() => ({id: props.channelId()}))
  const {displayName: channelDisplayName} = createChannelInfo(props.provider, knownChannelInfo)
  // TODO: FFZ IMPL
  const BTTVAccountResource = createBTTVAccountMeta()
  const BTTVDashboardsResource = createBTTVDashboardMeta()
  const FFZDashboardsResources = (props.channelNames ?? [])
    .map(channelName => createFFZAccountMeta(() => ({name: channelName})))
  const dashboardsSeasonalGroups = createMemo(() => {
    if (props.provider === EmoteProvider.BTTV) {
      const account = BTTVAccountResource()
      const dashboards = BTTVDashboardsResource()
      if (!account || !dashboards) return []
      return [account, ...dashboards].map(dashboard => {
        return {
          dashboard,
          seasonalGroups: createSeasonalGroupsResource(() => dashboard.providerId)
        }
      })
    } else if (props.provider === EmoteProvider.FFZ) {
      return FFZDashboardsResources
        .map(resource => resource())
        .filter(v => v !== null && v !== undefined)
        .map(data => ({
          dashboard: {displayName: data.user.display_name, providerId: String(data.user.twitch_id)},
          seasonalGroups: createSeasonalGroupsResource(() => String(data.user.twitch_id))
        }))
    } else {
      return []
    }
  })
  const systemGroups = createSeasonalGroupsResource(() => 'system')

  const [other, _setOther] = createSignal<EmoteGroupWithParentName | null>(null)

  const source = createMemo(() => {
    if (props.signals.type() === TransferModalType.Import) return other()
    else if (props.signals.type() === TransferModalType.Export)
      return {
        ...props.currentGroup(),
        group: channelDisplayName(),
        groupId: props.channelId()
      } as EmoteGroupWithParentName
  })
  const target = createMemo(() => {
    if (props.signals.type() === TransferModalType.Import)
      return {
        ...props.currentGroup(),
        group: channelDisplayName(),
        groupId: props.channelId()
      } as EmoteGroupWithParentName
    else if (props.signals.type() === TransferModalType.Export) return other()
  })
  const knownTargetChannelInfo = createMemo(() => ({name: channelNameFromGroup(target()?.group) ?? null}))
  const {id: targetChannelId} = createChannelInfo(props.provider, knownTargetChannelInfo)
  const {emotes, state: emotesState} = useEmotes(targetChannelId)

  const [transferListMods, setTransferListMods] = createSignal<(Emote | null)[]>([])
  const [transferSelectionList, setTransferSelectionList] = createStore<Record<string, boolean>>({})
  const transferList = createMemo<null | [Emote | false, Emote][]>(() => {
    const localEmotes = emotes()
    const sourceEmotes = source()?.emotes
    if (!sourceEmotes) return null
    const newTransferList: [Emote | false, Emote][] = []
    for (const emotes of sourceEmotes) {
      const [baseEmote, altEmote] = emotes
      const thatAreAltEmoteProvider = localEmotes.filter(emote => emote.provider === altEmote.provider.toUpperCase())
      let matched: EmoteData | undefined | null = null
      if (baseEmote) {
        matched ??= thatAreAltEmoteProvider.find(emote => emote.id === baseEmote.providerId)
        matched ??= thatAreAltEmoteProvider.find(emote => emote.code === baseEmote.code)
        matched ??= thatAreAltEmoteProvider.find(emote => emote.code.toUpperCase() === baseEmote.code.toUpperCase())
      }
      matched ??= thatAreAltEmoteProvider.find(emote => emote.code === altEmote.code)
      matched ??= thatAreAltEmoteProvider.find(emote => emote.code.toUpperCase() === altEmote.code.toUpperCase())
      if (!matched) newTransferList.push([false, altEmote])
      else newTransferList.push([{
        provider: matched?.provider.toLowerCase() as 'bttv' | 'ffz',
        providerId: matched.id,
        code: matched.code,
      }, altEmote])
      newTransferList.sort((pairA, pairB) => {
        let score = 0
        if (pairA[0] === false) score++
        if (pairB[0] === false) score--
        if (score !== 0) return score
        return (pairA[0] || pairA[1] as Emote).code.localeCompare((pairB[0] || pairB[1] as Emote).code)
      })
    }
    return newTransferList
  })

  const [afterEmotesReadyQueue, setAfterEmotesReadyQueue] = createSignal<Function[]>([])

  function setOther(other: CreateSelectValue<EmoteGroupWithParentName>) {
    if (Array.isArray(other)) return
    _setOther(other)
    setAfterEmotesReadyQueue(prev => [...prev, () => {
      setTransferListMods([])
      setTransferSelectionList(reconcile({}))
    }])
  }

  createEffect(on(emotesState, emotesState => {
    if (emotesState.startsWith('ready')) {
      for (const callback of afterEmotesReadyQueue()) callback()
      setAfterEmotesReadyQueue([])
    }
  }))

  onMount(() => {
    // For when type is Export
    setOther(null!)
  })

  const buttonDisabled = createMemo(() => {
    return !other() || !transferList() || transferList()?.length === 0 || !Object.values(transferSelectionList).includes(true) || props.signals.loading()
  })

  createEffect(() => {
    if (!props.signals.open()) {
      props.signals.setLoading(false)
      _setOther(null)
      setTransferListMods([])
      setTransferSelectionList(reconcile({}))
    }
  })

  function confirm() {
    const targetGroup = target()
    const transferListValue = transferList()
    if (!targetGroup || !transferListValue) return
    props.signals.setLoading(true)
    const transferListModsValue = transferListMods()
    const body = []
    for (let i = 0; i < transferListValue.length; i++) {
      let value = transferListValue[i]
      const override = transferListModsValue[i]
      if (override) value[0] = override
      if (!value[0] || !transferSelectionList[value[0].providerId]) continue
      body.push(value)
    }

    const url = `https://${API_HOST}/group/${targetGroup.groupId}/${targetGroup.id}`
    authFetch(url, {
      method: 'post',
      body: JSON.stringify(body),
      headers: {'Content-Type': 'application/json'},
    })
      .then(res => {
        if (res.ok) {
          props.signals.setOpen(false)
          props.seasonalGroups?.refetch()
        } else {
          error({
            type: ErrorType.Mutate,
            provider: props.provider,
            method: 'post',
            url,
            message: 'Couldn\'t transfer emotes',
            detail: `Server responded with status ${res.status}`,
          })
          props.signals.setLoading(false)
        }
      })
  }

  const adoptableGroupsOptions = createMemo(() => (
    createGroupedOptions([{
      name: 'By Tools for BTTV',
      id: 'system',
      options: systemGroups.seasonalGroupsArray()
    }, /*todo put current channel first*/ ...dashboardsSeasonalGroups().map(({dashboard, seasonalGroups}) => ({
      name: `From ${dashboard.displayName}`,
      id: dashboard.providerId,
      options: seasonalGroups.seasonalGroupsArray()
        .filter(group => group.id !== props.currentGroup()?.id)
    }))])
  ))

  const emoteModalSignals = createEmoteModalSignals()
  onMount(() => emoteModalSignals.setType(EmoteModalType.AsAlternative))
  const [emoteToSelect, setEmoteToSelect] = createSignal<null | EmoteData>(null)

  return (
    <Modal class={cn(seasonalPanelStyle.modal, seasonalPanelStyle.tall)} open={props.signals.open}
           setOpen={props.signals.setOpen} closeOnOverlayClick={false} provider={props.provider}>
      <p class={seasonalPanelStyle.heading}>Copy over Emote Associations</p>
      <p>
        <Show when={source()}>from "{source()?.name}" ({channelNameFromGroup(source()?.group)})</Show>
        &#32; {/* regular space */}
        <Show when={target()}>to "{target()?.name}" ({channelNameFromGroup(target()?.group)})</Show>
      </p>
      <small>
        This copies the seasonal emote associations from one seasonal group to another, or from a BTTV emote set to a
        seasonal group.
      </small>
      <label class={seasonalPanelStyle.label}>
        <span>
          <Show when={props.signals.type() === TransferModalType.Import}>Source</Show>
          <Show when={props.signals.type() === TransferModalType.Export}>Target</Show>
        </span>
        <Select<EmoteGroupWithParentName> {...adoptableGroupsOptions()} multiple={false} onChange={setOther}
                                          class={cn(seasonalPanelStyle.input)} format={(data, type) => {
          if (!data) return undefined
          if (type === 'option') {
            return data.label ?? data.text
          } else {
            return <>{data.name} <small>{data.group}</small></>
          }
        }}>
          <IoChevronDown class={cn(seasonalPanelStyle.chevron)} />
        </Select>
      </label>
      <Show when={other() && transferList()}>
        <Show
          when={transferList()?.some(([a]) => a && target()?.emotes.some(([b]) => b && a.providerId === b.providerId))}>
          <small>
            If an emote is already associated with a seasonal alternative (marked with "already in group"), selecting it
            will override the existing association.
          </small>
        </Show>
        <div class={seasonalPanelStyle.emoteReplacementList}>
          <For each={transferList()}>{(pair, index) =>
            <EmoteReplacement
              mode={'Link'} showProvider={true}
              applyEmotes={transferSelectionList} setApplyEmotes={setTransferSelectionList}
              pair={[(transferListMods()[index()] ?? pair[0]) || 'Not found in channel. Click to select.', pair[1]]}
              onClick0={(() => {
                setEmoteToSelect({
                  code: pair[1].code,
                  id: pair[1].providerId,
                  provider: props.provider,
                })
                const currentEmote0 = transferListMods()[index()] ?? pair[0]
                emoteModalSignals.setSelected(currentEmote0 ? currentEmote0.providerId : null)
                emoteModalSignals.setOpen(true)
              })}
              unapplicable={(
                pair[0] && target()?.emotes.some(([emote]) => emote && (pair[0] as Emote).providerId === emote.providerId)
              ) ? 'Already in group' : undefined} />
          }</For>
        </div>
        <Show when={transferList()?.length === 0}>
          <span>No emotes to copy over</span>
        </Show>
      </Show>
      <button class={cn(seasonalPanelStyle.button, seasonalPanelStyle.primary)}
              disabled={buttonDisabled()}
              onClick={confirm}>
        <Show when={props.signals.loading()}>
          <Spinner />
        </Show>
        <Show when={props.signals.type() === TransferModalType.Import}>
          Import
        </Show>
        <Show when={props.signals.type() === TransferModalType.Export}>
          Export
        </Show>
      </button>
      <EmoteModal
        signals={emoteModalSignals} provider={props.provider} confirmLabel={'Select'}
        channelId={targetChannelId} currentEmote={emoteToSelect}
        onConfirm={() => {
          const newTransferList = cloneDeep(transferListMods())
          const index = transferList()?.findIndex(([_, altEmote]) => altEmote.providerId === emoteToSelect()?.id)
          const selectedEmote = emotes()?.find(emote => emote.id === emoteModalSignals.selected())
          if (selectedEmote && typeof index === 'number' && index !== -1) {
            newTransferList[index] = {
              provider: props.provider.toLowerCase() as 'bttv' | 'ffz',
              providerId: selectedEmote?.id,
              code: selectedEmote?.code,
            }
            setTransferListMods(newTransferList)
          }
          emoteModalSignals.setSelected(null)
          emoteModalSignals.setOpen(false)
        }} />
    </Modal>
  )
}
