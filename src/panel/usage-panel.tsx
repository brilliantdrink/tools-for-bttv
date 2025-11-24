import {createMemo, For, Suspense} from 'solid-js'
import cn from 'classnames'
import {EmoteProvider} from '../util/emote-context'
import {createChannelInfo} from '../util/channel'
import BttvPanel from './panel'
import {createEmoteUsageResource, DATE_RANGE_LENGTH} from '../util/emote-usage'
import {useCurrentChannelContext} from '../util/track-current-channel'
import {Spinner} from '../spinner'

import emoteUsageStyles from '../emote-widget/emote-usage.module.scss'

interface UsagePanelProps {
  provider: EmoteProvider,
  panelClass?: string
  sectionClass?: string
  headingClass?: string
  emoteId: string
}

const dateFormatter = new Intl.DateTimeFormat("en", {day: 'numeric', month: 'short'})
// lookahead not optional because end ranges like in "Aug 31 - Sep 4" must not be selected
const dateEnMonthDaySpaceSelector = /([a-z])\s+(\d)(?=[^A-Za-z]+$)/
const dateEnSeparateMonthSplitter = /([A-Za-z]+ \d+\s+\W)\s+([A-Za-z]+ \d+)$/

export function UsagePanel(props: UsagePanelProps) {
  const currentChannelContext = useCurrentChannelContext()
  const {id: channelId} = createChannelInfo(props.provider, currentChannelContext.knownInfo)
  const usage = createEmoteUsageResource(props.provider, props.emoteId, channelId)

  const labels = createMemo(() => (usage() ?? []).map(([dateString]) => {
    const end = new Date(dateString)
    const start = new Date(end)
    start.setDate(start.getDate() - (DATE_RANGE_LENGTH - 1))
    return dateFormatter.formatRange(start, end)
      .replace(dateEnMonthDaySpaceSelector, '$1<br>$2')
      .replace(dateEnSeparateMonthSplitter, '$1<br>$2')
      .replace('–', '-')
  }))
  const maxValue = createMemo(() =>
    Math.max(1,
      (usage() ?? []).reduce((acc, [_, val]) => Math.max(acc, val), 0)
    )
  )

  return (
    <BttvPanel panelClass={cn(props.panelClass, emoteUsageStyles.emoteUsagePanel)}
               sectionClass={cn(props.sectionClass, emoteUsageStyles.sectionChart)}
               headingClass={cn(props.headingClass)}
               provider={props.provider} title={'Usage'}>
      <Suspense fallback={<Spinner centered />}>
        <p>
          <span class={emoteUsageStyles.usageNumber}>
            {(usage() ?? []).reduce((acc, [, val]) => acc + val, 0)}
          </span>
          &nbsp;
          <span class={emoteUsageStyles.usageLabel}>in the last 30 days</span>
        </p>
        <div class={emoteUsageStyles.chartWrapper}>
          <For each={usage()}>{(period, index) =>
            <>
              <div class={emoteUsageStyles.bar} style={{
                '--value': period[1],
                '--max-value': maxValue()
              }}>
                <span class={emoteUsageStyles.value}>{period[1]}</span>
              </div>
              <span class={emoteUsageStyles.label} innerHTML={labels()[index()]} />
            </>
          }</For>
        </div>
      </Suspense>
    </BttvPanel>
  )
}
