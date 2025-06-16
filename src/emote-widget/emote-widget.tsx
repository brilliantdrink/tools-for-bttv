import {createResource, createSignal, For, Show} from 'solid-js'
import {EChartsAutoSize} from 'echarts-solid'
import cn from 'classnames'
import debounce from 'lodash.debounce'
import StatusCodes from 'http-status-codes'
import {extName} from '../variables'
import {EmoteProvider} from '../util/emote-context'
import {useChannel} from '../util/channel'
import BttvPanel from './bttv-panel'
import {DATE_RANGE_LENGTH, useUsage} from '../util/emote-usage'
import DuplicatesList from './duplicates-list'
import {BTTVgetChannelId} from '../util/bttv-emotes'
import {FFZgetChannelId} from '../util/ffz-emotes'
import LoginPrompt, {ForbiddenError, GenericError} from '../login-prompt'
import {authFetch} from '../util/auth-fetch'
import {createEditorsSync} from '../util/editors-sync'

import dashWidgetStyles from '../dash-widget/dash-widget.module.scss'
import widgetStyles from './emote-widget.module.scss'
import emoteUsageStyles from './emote-usage.module.scss'

export interface EmoteWidgetData {
  emoteName: string,
  emoteId: string,
  panelClass: string,
  sectionClass: string,
  sectionClassName: string
  channelNames?: string[],
  halfWidth?: boolean,
}

export function EmoteWidget(props: { provider: EmoteProvider, data: EmoteWidgetData }) {
  const {channelId} = useChannel(props.provider)
  const usage = useUsage(props.provider, props.data.emoteId, channelId)
  if (props.provider === EmoteProvider.BTTV) createEditorsSync(channelId)
  const [emoteNotes, {mutate: mutateEmoteNotes, refetch}] = createResource(channelId, async (channelId) => {
    return await authFetch(`https://${API_HOST}/emote/${props.provider.toLowerCase()}/${props.data?.emoteId}/notes/${channelId}`)
      .then(async res => {
        if (res.ok) {
          return await res.json() as Promise<{ note: string, doNotRemove: boolean }>
        } else if (res.status === StatusCodes.UNAUTHORIZED || res.status === StatusCodes.FORBIDDEN) {
          return {error: res.status}
        } else {
          return {error: null}
        }
      })
      .catch(() => ({error: null}))
  })

  function toggleEmoteNotesDNR() {
    const currentEmoteNotes = emoteNotes()
    if (!currentEmoteNotes || 'error' in currentEmoteNotes) return
    mutateEmoteNotes({...currentEmoteNotes, doNotRemove: !currentEmoteNotes?.doNotRemove})
    authFetch(`https://${API_HOST}/emote/${props.provider.toLowerCase()}/${props.data?.emoteId}/notes/${channelId()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({doNotRemove: !currentEmoteNotes?.doNotRemove})
    })
  }

  const setEmoteNotes = debounce((note: string) => {
    const currentEmoteNotes = emoteNotes()
    if (!currentEmoteNotes || 'error' in currentEmoteNotes) return
    mutateEmoteNotes({...currentEmoteNotes, note})
    authFetch(`https://${API_HOST}/emote/${props.provider.toLowerCase()}/${props.data?.emoteId}/notes/${channelId()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({note})
    })
  }, 500, {leading: false, trailing: true})

  const duplicatesPanel = (
    <div class={cn(dashWidgetStyles.bttv, props.data?.panelClass, widgetStyles.twoWide)}>
      <div class={cn(props.data?.sectionClass, props.provider === EmoteProvider.FFZ && 'panel-heading')}>
        <p class={cn('chakra-text css-0', widgetStyles.headingP)}>Duplicates in Channel</p>
      </div>
      <Show when={props.provider === EmoteProvider.BTTV}>
        <hr class={'chakra-divider'} />
      </Show>
      <Show when={props.data.channelNames}>
        <For each={props.data.channelNames}>
          {(channelName, index) => {
            const [channelId, setChannelId] = createSignal<string>(null!)
            let getChannelId = null
            if (props.provider === EmoteProvider.BTTV) getChannelId = BTTVgetChannelId
            else if (props.provider === EmoteProvider.FFZ) getChannelId = FFZgetChannelId
            if (!getChannelId) return
            getChannelId(channelName).then(setChannelId)
            return (<>
              <p class={cn(
                widgetStyles.panelSectionHeading,
                props.provider === EmoteProvider.FFZ && widgetStyles.ffzPanelSectionHeading
              )}>
                {channelName}
              </p>
              <DuplicatesList channelId={channelId} emoteName={props.data.emoteName} emoteId={props.data.emoteId}
                              provider={props.provider} sectionClass={props.data.sectionClass} />
              <Show when={index() !== ((props.data.channelNames?.length ?? 0) - 1)}>
                <hr class={cn('chakra-divider', props.provider === EmoteProvider.FFZ && widgetStyles.ffzDivider)} />
              </Show>
            </>)
          }}
        </For>
      </Show>
      <Show when={!props.data.channelNames}>
        <DuplicatesList channelId={channelId} emoteName={props.data.emoteName} emoteId={props.data.emoteId}
                        provider={props.provider} sectionClass={props.data.sectionClass} />
      </Show>
    </div>
  )

  if (props.provider === EmoteProvider.FFZ) return duplicatesPanel

  return (<>
    <div class={widgetStyles.col}>
      <p class={dashWidgetStyles.title}>{extName}</p>
      <div class={cn(widgetStyles.emoteRow, props.data.halfWidth && widgetStyles.halfWidth)}>
        {duplicatesPanel}
        {/*<div class={cn(dashWidgetStyles.bttv, props.data?.panelClass)}>
          <div class={cn(props.data?.sectionClass)}>
            <p class={'chakra-text css-0'}>Fallbacks</p>
          </div>
          <hr class={'chakra-divider'} />
          <div class={cn(dashWidgetStyles.emoteList, 'chakra-stack', props.data?.sectionClass)}>

          </div>
        </div>
        <div class={cn(dashWidgetStyles.bttv, props.data?.panelClass)}>
          <div class={cn(props.data?.sectionClass)}>
            <p class={'chakra-text css-0'}>Seasonal Alternatives</p>
          </div>
          <hr class={'chakra-divider'} />
          <div class={cn(dashWidgetStyles.emoteList, 'chakra-stack', props.data?.sectionClass)}>

          </div>
        </div>*/}
        {/*<div class={widgetStyles.col}>*/}
        <BttvPanel panelClass={cn(props.data?.panelClass, emoteUsageStyles.emoteUsagePanel)}
                   sectionClass={cn(props.data?.sectionClass, emoteUsageStyles.sectionChart)} title={'Usage'}>
          <p>
            <span class={emoteUsageStyles.usageNumber}>
              {(usage() ?? []).reduce((acc, [, val]) => acc + val, 0)}
            </span>
            &nbsp;
            <span class={emoteUsageStyles.usageLabel}>in the last 30 days</span>
          </p>
          <div class={emoteUsageStyles.chartWrapper}>
            <EChartsAutoSize
              option={{
                color: ['#63b3ed'],
                grid: {left: 0, right: 0, top: 0, bottom: 35},
                animation: false,
                xAxis: {
                  axisLine: {show: false},
                  axisTick: {show: false},
                  axisLabel: {color: 'rgba(255, 255, 255, 0.92)', fontSize: 11, lineHeight: 12},
                  splitLine: {show: false},
                  type: 'category',
                  data: (usage() ?? []).map(([dateString]) => {
                    const date = new Date(dateString)
                    const rangeEndString = date.toLocaleDateString('en', {day: 'numeric', month: 'numeric'})
                    date.setDate(date.getDate() - (DATE_RANGE_LENGTH - 1))
                    const rangeStartString = date.toLocaleDateString('en', {day: 'numeric', month: 'numeric'})
                    return `${rangeStartString} -\n${rangeEndString}`
                  })
                },
                yAxis: {splitLine: {show: false}, type: 'value'},
                series: {
                  data: (usage() ?? []).map(([, value]) => ({
                    value, itemStyle: {borderRadius: [5, 5, 0, 0]}
                  })),
                  type: "bar",
                  label: {
                    color: 'rgb(23, 25, 35)',
                    show: true,
                    position: 'insideTop',
                    distance: 3,
                  },
                  barMinHeight: 15,
                },
              }}
            />
          </div>
        </BttvPanel>
        <BttvPanel panelClass={props.data?.panelClass}
                   sectionClass={cn(props.data?.sectionClass, dashWidgetStyles.col)}
                   title={'Notes'} /*description={'Synced with fallbacks and seasonal alternatives'}*/>
          <Show when={emoteNotes.state === 'ready' && !('error' in emoteNotes())}>
            <label class={dashWidgetStyles.checkbox}>
              <input type="checkbox" onChange={toggleEmoteNotesDNR}
                     checked={(emoteNotes() as { doNotRemove: boolean }).doNotRemove} />
              <span class={cn(dashWidgetStyles.control, (emoteNotes() as {
                doNotRemove: boolean
              }).doNotRemove && dashWidgetStyles.checked)}>
                  <Show when={(emoteNotes() as { doNotRemove: boolean }).doNotRemove}>
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%;">
                      <svg viewBox="0 0 12 10"
                           style="fill: none; stroke-width: 2px; stroke: currentcolor; stroke-dasharray: 16px;">
                        <polyline points="1.5 6 4.5 9 10.5 1"></polyline>
                      </svg>
                    </div>
                  </Show>
                </span>
              <span class={dashWidgetStyles.label}>Do not remove</span>
              <span class={dashWidgetStyles.hint}>Just a marker, does not get enforced</span>
            </label>
            <textarea class={dashWidgetStyles.textarea} rows="3" placeholder="Notes for this emote group"
                      onInput={(event) => setEmoteNotes(event.currentTarget.value)}>
                {(emoteNotes() as { note: string }).note}
              </textarea>
          </Show>
          <Show when={emoteNotes.state === 'ready' && 'error' in emoteNotes()}>
            <Show when={(emoteNotes() as { error: any }).error === StatusCodes.UNAUTHORIZED}>
              <LoginPrompt provider={props.provider} refetch={refetch} />
            </Show>
            <Show when={(emoteNotes() as { error: any }).error === StatusCodes.FORBIDDEN}>
              <ForbiddenError provider={props.provider} />
            </Show>
            <Show when={(emoteNotes() as { error: any }).error === null}>
              <GenericError />
            </Show>
          </Show>
        </BttvPanel>
        {/*</div>*/}
      </div>
    </div>
  </>)
}
