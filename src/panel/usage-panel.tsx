import {Accessor, Show} from 'solid-js'
import {EChartsAutoSize, use as echartsUse} from 'echarts-solid'
import {BarChart} from 'echarts/charts'
import {SVGRenderer} from 'echarts/renderers'
import {GridComponent} from 'echarts/components'
import cn from 'classnames'
import {EmoteProvider} from '../util/emote-context'
import {createChannelState} from '../util/channel'
import BttvPanel from './panel'
import {createEmoteUsageResource, DATE_RANGE_LENGTH} from '../util/emote-usage'

import emoteUsageStyles from '../emote-widget/emote-usage.module.scss'

echartsUse([BarChart, SVGRenderer, GridComponent])

interface UsagePanelProps {
  provider: EmoteProvider,
  panelClass?: string
  sectionClass?: string
  headingClass?: string
  emoteId: string
  channelId?: Accessor<string>
}

const dateFormatter = new Intl.DateTimeFormat("en", {day: 'numeric', month: 'short'})
// lookahead not optional because end ranges like in "Aug 31 - Sep 4" must not be selected
const dateEnMonthDaySpaceSelector = /([a-z])\s+(\d)(?=[^A-Za-z]+$)/
const dateEnSeparateMonthSplitter = /([A-Za-z]+ \d+\s+\W)\s+([A-Za-z]+ \d+)$/

export function UsagePanel(props: UsagePanelProps) {
  const channelId = props.channelId ?? createChannelState(props.provider).channelId
  const usage = createEmoteUsageResource(props.provider, props.emoteId, channelId)

  return (
    <BttvPanel panelClass={cn(props.panelClass, emoteUsageStyles.emoteUsagePanel)}
               sectionClass={cn(props.sectionClass, emoteUsageStyles.sectionChart)}
               headingClass={cn(props.headingClass)}
               provider={props.provider} title={'Usage'}>
      <p>
        <span class={emoteUsageStyles.usageNumber}>
          {(usage() ?? []).reduce((acc, [, val]) => acc + val, 0)}
        </span>
        &nbsp;
        <span class={emoteUsageStyles.usageLabel}>in the last 30 days</span>
      </p>
      <div class={emoteUsageStyles.chartWrapper}>
        {/*todo: build custom chart to reduce bundle size by probably like 500kb*/}
        <Show when={usage()}> {/* delays render -> fixes layout issue on ffz */}
          <EChartsAutoSize
            initOptions={{renderer: 'svg'}}
            option={{
              color: ['#63b3ed'],
              grid: {left: 0, right: 0, top: 0, bottom: 35},
              animation: false,
              cursor: 'default',
              xAxis: {
                axisLine: {show: false},
                axisTick: {show: false},
                axisLabel: {
                  interval: 0, // show all labels always
                  margin: 6,
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontFamily: 'Sofia Sans Condensed',
                  fontSize: 11,
                  lineHeight: 13,
                },
                splitLine: {show: false},
                type: 'category',
                data: (usage() ?? []).map(([dateString]) => {
                  const end = new Date(dateString)
                  // end.setDate(end.getDate() - (1))
                  const start = new Date(end)
                  start.setDate(start.getDate() - (DATE_RANGE_LENGTH - 1))
                  return dateFormatter.formatRange(start, end)
                    .replace(dateEnMonthDaySpaceSelector, '$1\n$2')
                    .replace(dateEnSeparateMonthSplitter, '$1\n$2')
                    .replace('–', '-')
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
        </Show>
      </div>
    </BttvPanel>
  )
}
