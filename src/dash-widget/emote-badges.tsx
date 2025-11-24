import {Accessor, createMemo, Resource, Show} from 'solid-js'
import cn from 'classnames'
import {createVisibilityObserver} from '@solid-primitives/intersection-observer'
import {createEmoteUsagesResource} from '../util/emote-usage'
import {createChannelInfo} from '../util/channel'
import {EmoteProvider} from '../util/emote-context'
import {createBatchedValues} from '../util/batched-resource'

import emoteBadgeStyles from './emote-badges.module.scss'
import tooltipStyles from '../tooltip.module.scss'
import {createAccumulatedValues} from '../util/accumulated-values'
import {createEmoteNotesResource} from '../util/emote-notes'
import {createLatched} from '../util/latched'

const usageWords = {
  [emoteBadgeStyles.noUse]: 'No',
  [emoteBadgeStyles.lowUse]: 'Low',
  [emoteBadgeStyles.avgUse]: 'Average',
  [emoteBadgeStyles.highUse]: 'High',
}
const numberFormatter = Intl.NumberFormat('en', {notation: 'compact'})

export default function EmoteBadges(props: { emoteId: string, provider: EmoteProvider }) {
  const {id: channelId} = createChannelInfo(props.provider)
  let visCatcher: HTMLDivElement | undefined = undefined;
  const useVisibilityObserver = createVisibilityObserver({threshold: 0.1});
  const visible = useVisibilityObserver(() => visCatcher);
  const allVisibilities = createAccumulatedValues('visibility', props.emoteId, visible, true)
  const idsBatched = createBatchedValues('usage', props.emoteId, props.emoteId)
  const batchVisible = createMemo(() => {
    return allVisibilities() && Object.entries(allVisibilities())
      .filter(([id]) => idsBatched()?.includes(id))
      .reduce((acc, [, visible]) => acc || visible, false)
  })
  const showBadges = createLatched(batchVisible)

  const usagesBatched = createMemo(() => {
    if (!showBadges()) return null
    const idsBatchedValue = idsBatched()
    if (idsBatchedValue !== null) return createEmoteUsagesResource(props.provider, idsBatched as Accessor<string[]>, channelId)
    else return null
  })
  const usage = createMemo(() => {
    const resource = usagesBatched() as Resource<Record<string, [string, number][]>>
    if (!resource || resource.loading) return null
    else {
      const usages = resource()
      if (!usages) return null
      return usages[props.emoteId]?.reduce((acc, [, val]) => acc + val, 0) ?? 0
    }
  })
  const formattedUsage = createMemo(() => usage() !== null ? numberFormatter.format(usage() as number) : null)
  const allUsages = createAccumulatedValues('usage', props.emoteId, usage)
  const usageClass = createMemo(() => {
    const usageValue = usage()
    if (!allUsages() || allUsages().length === 0 || !usageValue) return emoteBadgeStyles.noUse
    // from experience an exponential distribution, so standard deviation = mean
    const average = allUsages().reduce((acc, n) => acc as number + (n ?? 0), 0) as number / allUsages().length
    const standardDeviation = average

    if (usageValue <= average - (standardDeviation / 2))
      return emoteBadgeStyles.lowUse
    else if (usageValue >= average + standardDeviation && usageValue > 10)
      return emoteBadgeStyles.highUse
    else
      return emoteBadgeStyles.avgUse
  })

  const notesBatched = createMemo(() => {
    if (!showBadges()) return null
    const idsBatchedValue = idsBatched()
    if (idsBatchedValue !== null) {
      return createEmoteNotesResource(props.provider, idsBatched as Accessor<string[]>, channelId)
    } else return null
  })
  const note = createMemo(() => {
    const resource = notesBatched() as Resource<Record<string, {
      note: string
      doNotRemove: boolean
    }>>
    if (!resource || resource.loading) return null
    else {
      const notes = resource()
      if (!notes) return null
      return notes[props.emoteId]
    }
  })

  return <>
    <div ref={visCatcher} class={emoteBadgeStyles.visCatcher} />
    <div class={cn(emoteBadgeStyles.usage, emoteBadgeStyles[props.provider.toLowerCase()], tooltipStyles.trigger,
      usage() !== null ? usageClass() : emoteBadgeStyles.loading,)}>
      <Show when={usage() !== null}>
        {formattedUsage()}
        <div class={cn(emoteBadgeStyles.tooltip, tooltipStyles.tooltip)}>{usageWords[usageClass()]} usage in the past 30
          days
        </div>
      </Show>
    </div>
    <Show when={note()?.doNotRemove}>
      <div class={cn(emoteBadgeStyles.dnr, emoteBadgeStyles[props.provider.toLowerCase()], tooltipStyles.trigger)}>
        <DNRIcon />
        <div class={cn(emoteBadgeStyles.tooltip, tooltipStyles.tooltip)}>"Do Not Remove" marker set</div>
      </div>
    </Show>
  </>
}

function DNRIcon() {
  return (
    <svg viewBox="0 0 240 240">
      <path fill="currentColor" fill-opacity=".7"
            d="M185.4 220.7a52.6 52.6 0 0 1-28 15.7c-13.2 2.8-36 4-52.7 2.7-27.2-2.1-37.2-5.5-48.1-16.5-10.3-10.4-13.6-19-17.5-46.1-3-21.3-4.1-35.4-4.8-65.6l-.6-28.7 12-1.1 139.7 139.6ZM112.5 77.1c30.5-.2 61.9 1.4 89.7 4.9l3.8.4v17.8c0 22.2-1.5 46.5-3.8 66.6l-89.7-89.7Z" />
      <path fill="currentColor"
            d="M107 1.5a79.7 79.7 0 0 1 30.5 1c19 5 31.8 18.7 36 38.8a79 79 0 0 1 1.5 10.2c0 1.4.3 2.5.6 2.5 5.7 0 38.5 4.5 40.5 5.6 5.9 3 7.9 12.6 3.7 17.9-3.7 4.7-7.6 5.7-17.6 4.5a689.5 689.5 0 0 0-89.7-4.9L68.7 33.4c2.4-7.2 6-13 10.8-17.9a56.4 56.4 0 0 1 27.6-14ZM45.9 81c-6.7.7-13.2 1.2-15.7 1.2-5 .1-5.6-.2-8.7-3.6-2.9-3.1-3.4-4.4-3.4-8.5 0-5.3 1.7-8.5 6-10.7h.1L45.8 81Zm81-55a30.3 30.3 0 0 0-15.8.3c-8.8 2-13 4.8-17.2 11.6A52 52 0 0 0 90 51.5c0 .3 13.5.5 30 .5h30.2l-.7-3.3c-1.7-8.1-2.8-11-5.7-14.3-4-4.6-9-7-17-8.4Z" />
      <path stroke="currentColor" stroke-linecap="round" stroke-width="20" d="m20 20 200 200" />
    </svg>
  )
}
