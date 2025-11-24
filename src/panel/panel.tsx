import {JSX, Show, Suspense} from 'solid-js'
import cn from 'classnames'
import {EmoteProvider} from '../util/emote-context'
import {Spinner} from '../spinner'

import dashWidgetStyles from '../dash-widget/dash-widget.module.scss'
import styles from './panel.module.scss'

export default function BttvPanel(props: {
  title: string,
  description?: string,
  children: JSX.Element
  panelClass?: string,
  sectionClass?: string
  headingClass?: string
  provider: EmoteProvider
}) {
  return <>
    <div class={cn(dashWidgetStyles.bttv, styles.panel, props.panelClass)}>
      <div class={cn(styles.col, props.description && styles.header, props.sectionClass, props.headingClass)}>
        <p class={cn('chakra-text css-0', props.provider === EmoteProvider.FFZ && styles.headingP)}>
          {props.title}
        </p>
        <Show when={props.description}>
          <p class={styles.description}>{props.description}</p>
        </Show>
      </div>
      <Show when={props.provider === 'BTTV'}>
        <hr class={'chakra-divider'} />
      </Show>
      <div class={cn(styles.content, 'chakra-stack', props.sectionClass, styles[props.provider.toLowerCase()])}>
        {/* suspense doesnt work here */}
        {props.children}
      </div>
    </div>
  </>
}
