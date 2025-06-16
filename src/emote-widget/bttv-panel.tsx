import {JSX, Show} from 'solid-js'
import cn from 'classnames'

import dashWidgetStyles from '../dash-widget/dash-widget.module.scss'
import widgetStyles from './emote-widget.module.scss'

export default function BttvPanel(props: {
  title: string,
  description?: string,
  children: JSX.Element
  panelClass?: string,
  sectionClass?: string
}) {
  return <>
    <div class={cn(dashWidgetStyles.bttv, widgetStyles.panel, props.panelClass)}>
      <div class={cn(widgetStyles.col, props.description && widgetStyles.panelHeader, props.sectionClass)}>
        <p class={'chakra-text css-0'}>{props.title}</p>
        <Show when={props.description}>
          <p class={widgetStyles.description}>{props.description}</p>
        </Show>
      </div>
      <hr class={'chakra-divider'} />
      <div class={cn(dashWidgetStyles.panelContent, 'chakra-stack', props.sectionClass)}>
        {props.children}
      </div>
    </div>
  </>
}
