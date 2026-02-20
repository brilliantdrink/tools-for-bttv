import {Accessor, createEffect, createSignal, For, Show, Suspense} from 'solid-js'
import cn from 'classnames'
import {FaSolidPlus} from 'solid-icons/fa'
import StatusCodes from 'http-status-codes'
import {extName} from '../variables'
import {EmoteProvider, useEmotes} from '../util/emote-context'
import {createChannelInfo} from '../util/channel'
import {EmoteListDetails} from './emote-list'
import {EmoteCard} from '../emote-card'
import {createEditorsSync} from '../util/editors-sync'
import {Checkbox} from '../checkbox'
import {clientSettings, createClientSetting} from '../client-settings'
import {createSeasonalGroupsResource, EmoteGroup} from '../panel/seasonal-panel/seasonal-query'
import SeasonalListItem from '../panel/seasonal-panel/seasonal-list-item'
import {createGroupModalSignals, GroupModal, GroupModalType} from '../panel/seasonal-panel/group-modal'
import {createDeleteModalSignals, DeleteModal, DeleteModalType} from '../panel/seasonal-panel/delete-modal'
import {ApplyModal, ApplyModalType, createApplyModalSignals} from '../panel/seasonal-panel/apply-modal'
import {createTransferModalSignals, TransferModal, TransferModalType} from '../panel/seasonal-panel/transfer-modal'
import {useCurrentChannelContext} from '../util/track-current-channel'
import LoginPrompt, {ForbiddenError} from '../login-prompt'
import {Spinner} from '../spinner'

import widgetStyles from './dash-widget.module.scss'
import emoteCardStyles from '../emote-card.module.scss'
import seasonalPanelStyle from '../panel/seasonal-panel.module.scss'

export function DashWidget(props: { provider: EmoteProvider, channelNames?: string[] }) {
  const currentChannelContext = useCurrentChannelContext()
  const {
    id: channelId,
    displayName: channelDisplayName
  } = createChannelInfo(props.provider, currentChannelContext.knownInfo)
  const {overlapping, likelyDuplicates} = useEmotes(channelId)
  if (props.provider === EmoteProvider.BTTV) createEditorsSync(channelId)

  createEffect(() => {
    const channelName = channelDisplayName()?.toLowerCase()
    if (!channelName) return
    clientSettings.set('ffz-selected-channel', channelName)
  })

  const [bttvEmoteLazy, setBttvEmoteLazy] = createClientSetting('bttv-emote-lazy-rendering', false)

  const seasonalGroupsResource = createSeasonalGroupsResource(channelId)
  const {seasonalGroups, seasonalGroupsArray, refetch: refetchSeasonal} = seasonalGroupsResource

  const [currentSeasonalGroup, setCurrentSeasonalGroup] = createSignal<EmoteGroup | null>(null)
  const groupModalSignals = createGroupModalSignals()
  const deleteModalSignals = createDeleteModalSignals()
  const applyModalSignals = createApplyModalSignals()
  const transferModalSignals = createTransferModalSignals()

  return (<>
    <div class={cn(
      widgetStyles[props.provider.toLowerCase()],
      props.provider === EmoteProvider.FFZ && 'panel panel-default'
    )} id={widgetStyles.bttvFfzHelper}>
      <p class={cn(
        widgetStyles.title,
        props.provider === EmoteProvider.FFZ && 'panel-heading'
      )}>
        {extName}
      </p>
      <p class={widgetStyles.heading}>Duplicates</p>
      <EmoteListDetails title={'Exact name match'} loading={() => !overlapping()}
                        amount={overlapping()?.length}
                        detailsClass={cn(props.provider === EmoteProvider.FFZ && widgetStyles.ffzDetails, widgetStyles.details)}>
        <div class={widgetStyles.emotesPairContainer}>
          <For each={overlapping()}>
            {(emotes) => (
              <div class={emoteCardStyles.emotesContainer}>
                <EmoteCard emote={emotes[0]} />
                <EmoteCard emote={emotes[1]} />
              </div>
            )}
          </For>
        </div>
      </EmoteListDetails>
      <EmoteListDetails title={'Non-exact name match'} loading={() => !likelyDuplicates()}
                        amount={likelyDuplicates()?.length}
                        detailsClass={cn(props.provider === EmoteProvider.FFZ && widgetStyles.ffzDetails, widgetStyles.details)}>
        <small>Suspected duplicates, or different emotes with similar names</small>
        <div class={widgetStyles.emotesPairContainer}>
          <For each={likelyDuplicates()}>
            {(emotes) => (
              <div class={emoteCardStyles.emotesContainer}>
                <EmoteCard emote={emotes[0]} />
                <EmoteCard emote={emotes[1]} />
              </div>
            )}
          </For>
        </div>
      </EmoteListDetails>
      <p class={widgetStyles.heading}>Seasonal</p>
      <Suspense fallback={<Spinner centered />}>
        <ul class={cn(seasonalPanelStyle.groupList, widgetStyles.seasonalList)}>
          <For each={seasonalGroupsArray()}>{group =>
            <SeasonalListItem group={group} setCurrentGroup={setCurrentSeasonalGroup}
                              buttons={[
                                TransferModalType.Import, ApplyModalType.Apply,
                                'separator' as 'separator',
                                GroupModalType.Edit, DeleteModalType.Group,
                              ]}
                              groupModalSignals={groupModalSignals} applyModalSignals={applyModalSignals}
                              transferModalSignals={transferModalSignals} deleteModalSignals={deleteModalSignals} />
          }</For>
        </ul>
        <Show when={seasonalGroups.state === 'ready' && !('error' in seasonalGroups())}>
          <Show when={seasonalGroupsArray().length === 0}>
            <small class={widgetStyles.small}>No seasonal groups</small>
          </Show>
          <button class={cn(seasonalPanelStyle.button, widgetStyles.addButton)} onClick={() => {
            groupModalSignals.setType(GroupModalType.Create)
            groupModalSignals.setOpen(true)
          }}>
            <FaSolidPlus />
            New Seasonal Group
          </button>
        </Show>
        <Show when={seasonalGroups.state === 'ready' && 'error' in seasonalGroups()}>
          <Show when={(seasonalGroups() as { error: any }).error === StatusCodes.UNAUTHORIZED}>
            <LoginPrompt provider={props.provider} refetch={refetchSeasonal} compact
                         channelId={channelId} channelDisplayName={channelDisplayName} />
          </Show>
          <Show when={(seasonalGroups() as { error: any }).error === StatusCodes.FORBIDDEN}>
            <ForbiddenError provider={props.provider} channelDisplayName={channelDisplayName} compact />
          </Show>
        </Show>
      </Suspense>
      <DeleteModal provider={props.provider} signals={deleteModalSignals} seasonalGroups={seasonalGroupsResource}
                   currentGroup={currentSeasonalGroup} currentPair={() => undefined} channelId={channelId} />
      <GroupModal provider={props.provider} signals={groupModalSignals} seasonalGroups={seasonalGroupsResource}
                  currentGroup={currentSeasonalGroup} setCurrentGroup={setCurrentSeasonalGroup}
                  channelId={channelId} />
      <ApplyModal provider={props.provider} signals={applyModalSignals} currentGroup={currentSeasonalGroup}
                  channelId={channelId} />
      <TransferModal provider={props.provider} signals={transferModalSignals} channelNames={props.channelNames}
                     seasonalGroups={seasonalGroupsResource}
                     currentGroup={currentSeasonalGroup as Accessor<EmoteGroup>} channelId={channelId} />
      {/* todo: make this a proper array, render dynamically */}
      <Show when={props.provider === EmoteProvider.BTTV}>
        <p class={widgetStyles.heading}>Tweaks</p>
        <Checkbox class={widgetStyles.checkbox} checked={bttvEmoteLazy}
                  setChecked={() => setBttvEmoteLazy(!bttvEmoteLazy())}
                  label={'BTTV: Lazy Rendering'} hint={'Reduce lag by not rendering off-screen emotes'} />
      </Show>
    </div>
  </>)
}
