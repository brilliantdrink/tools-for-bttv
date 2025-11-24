import {createEffect, createMemo, createResource, createSignal, For, Show, Suspense} from 'solid-js'
import {CacheEntry, makeCache} from '@solid-primitives/resource'
import cn from 'classnames'
import StatusCodes from 'http-status-codes'
import {FaSolidPlus} from 'solid-icons/fa'
import {emoteCache, EmoteData, EmoteProvider, useEmotes} from '../util/emote-context'
import {createChannelInfo} from '../util/channel'
import BttvPanel from './panel'
import SeasonalListItem from './seasonal-panel/seasonal-list-item'
import {createSeasonalGroupsResource, EmoteGroup} from './seasonal-panel/seasonal-query'
import {createGroupModalSignals, GroupModal, GroupModalType} from './seasonal-panel/group-modal'
import {createEmoteModalSignals, EmoteModal, EmoteModalType} from './seasonal-panel/emote-modal'
import {createDeleteModalSignals, DeleteModal, DeleteModalType} from './seasonal-panel/delete-modal'
import {useCurrentChannelContext} from '../util/track-current-channel'
import LoginPrompt, {ForbiddenError, GenericError} from '../login-prompt'
import {getBTTVEmote} from '../util/bttv-emotes'
import {getFFZEmote} from '../util/ffz-emotes'
import {Spinner} from '../spinner'

import seasonalPanelStyle from './seasonal-panel.module.scss'

interface UsagePanelProps {
  provider: EmoteProvider,
  panelClass?: string
  sectionClass?: string
  headingClass?: string
  emoteId: string
}

export function SeasonalPanel(props: UsagePanelProps) {
  const currentChannelContext = useCurrentChannelContext()
  const {id: channelId, displayName: channelDisplayName} =
    createChannelInfo(props.provider, currentChannelContext.knownInfo)

  const groupModalSignals = createGroupModalSignals()
  const emoteModalSignals = createEmoteModalSignals()
  const deleteModalSignals = createDeleteModalSignals()

  const [currentGroup, setCurrentGroup] = createSignal<EmoteGroup | null>(null)

  const seasonalGroupsResource = createSeasonalGroupsResource(channelId)
  const {seasonalGroups, seasonalGroupsArray, refetch} = seasonalGroupsResource

  const {emotes} = useEmotes(channelId)
  const [currentEmoteFetcher] = makeCache<EmoteData | null, string, unknown>(async emoteId => {
    if (props.provider === EmoteProvider.BTTV) {
      return {...await getBTTVEmote(emoteId), provider: EmoteProvider.BTTV} as EmoteData
    } else if (props.provider === EmoteProvider.FFZ) {
      return {...await getFFZEmote(emoteId), provider: EmoteProvider.FFZ} as EmoteData
    } else return null
  }, {
    cache: emoteCache as Record<string, CacheEntry<EmoteData | null, string>>,
    sourceHash: source => `${props.provider.toLowerCase()}-local-${source}`
  })
  const [currentEmote] = createResource(() => props.emoteId, currentEmoteFetcher)

  const currentPair = createMemo(() => {
    return currentGroup()?.emotes.find(([targetEmote, altEmote]) =>
      currentEmote()?.id === targetEmote.providerId || currentEmote()?.id === altEmote.providerId
    )
  })

  const context = createMemo(() => ({
    emoteId: props.emoteId, provider: props.provider, channelId: channelId,
    currentGroup, setCurrentGroup,
    seasonalGroups: seasonalGroupsResource,
    emotes, currentEmote, currentPair
  }))

  return (
    <BttvPanel panelClass={cn(props.panelClass)}
               sectionClass={cn(
                 props.sectionClass,
                 seasonalPanelStyle.section,
                 (seasonalGroups.state === 'ready' && 'error' in seasonalGroups()) && seasonalPanelStyle.nonScroll
               )}
               headingClass={cn(props.headingClass, seasonalPanelStyle.heading)}
               provider={props.provider} title={'Seasonal'}>
      <Suspense fallback={<Spinner centered />}>
        <Show when={(seasonalGroups() as any)?.['error'] === undefined}>
          <Show when={seasonalGroupsArray().length === 0}>
            <small>No seasonal groups</small>
          </Show>
          <Show when={seasonalGroupsArray().length > 0}>
            <ul class={seasonalPanelStyle.groupList}>
              <For each={seasonalGroupsArray()}>{group => {
                const isInGroup = createMemo(() => {
                  const currentEmoteValue = currentEmote()
                  if (!currentEmoteValue) return false
                  let isInGroup: 'target' | 'alt' | false = false
                  for (const [targetEmote, altEmote] of group.emotes) {
                    if (targetEmote.providerId === currentEmote()?.id) isInGroup = 'target'
                    else if (altEmote.providerId === currentEmote()?.id) isInGroup = 'alt'
                    if (isInGroup) break
                  }
                  return isInGroup
                })
                return <SeasonalListItem group={group} setCurrentGroup={setCurrentGroup} buttons={[
                  isInGroup() ? DeleteModalType.Emote : [EmoteModalType.AsAlternative, EmoteModalType.AddAlternative],
                  'separator' as 'separator',
                  GroupModalType.Edit, DeleteModalType.Group
                ].flat()} {...{groupModalSignals, emoteModalSignals, deleteModalSignals}}
                />
              }}</For>
            </ul>
          </Show>
          <button class={cn(seasonalPanelStyle.button)} onClick={() => {
            groupModalSignals.setType(GroupModalType.Create)
            groupModalSignals.setOpen(true)
          }}>
            <FaSolidPlus />
            New Seasonal Group
          </button>
          <GroupModal signals={groupModalSignals} {...context()} />
          <EmoteModal signals={emoteModalSignals} {...context()} />
          <DeleteModal signals={deleteModalSignals} {...context()} />
        </Show>
        <Show when={(seasonalGroups() as any)?.['error'] !== undefined}>
          <Show when={(seasonalGroups() as { error: any }).error === StatusCodes.UNAUTHORIZED}>
            <LoginPrompt provider={props.provider} refetch={refetch} channelId={channelId}
                         channelDisplayName={channelDisplayName} />
          </Show>
          <Show when={(seasonalGroups() as { error: any }).error === StatusCodes.FORBIDDEN}>
            <ForbiddenError provider={props.provider} channelDisplayName={channelDisplayName} />
          </Show>
          <Show when={(seasonalGroups() as { error: any }).error === null}>
            <GenericError />
          </Show>
        </Show>
      </Suspense>
    </BttvPanel>
  )
}
