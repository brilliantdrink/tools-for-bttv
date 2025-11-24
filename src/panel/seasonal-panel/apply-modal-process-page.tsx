import {Accessor, For, Setter, Show} from 'solid-js'
import cn from 'classnames'
import Sp from '../../util/space'
import {ApplyModalProps, ApplyModalType} from './apply-modal'

import styles from './apply-modal.module.scss'
import seasonalPanelStyle from '../seasonal-panel.module.scss'

interface ApplyModalProcessPageProps extends ApplyModalProps {
  operations: Accessor<number>
  operationsDone: Accessor<number>
  shouldStop: Accessor<boolean>
  errors: Accessor<string[]>
  isDone: Accessor<boolean>
  currentStep: Accessor<string>
  setShouldStop: Setter<boolean>
}

export function ApplyModalProcessPage(props: ApplyModalProcessPageProps) {
  return (<>
    <small>
      Removing emotes from channel first, then adding the
      <Show when={props.signals.type() === ApplyModalType.Apply}><Sp />seasonal emotes</Show>
      <Show when={props.signals.type() === ApplyModalType.Unapply}><Sp />non-seasonal emotes</Show>
      ...
    </small>
    <progress class={styles.progress} max={props.operations()} value={props.operationsDone()} />
    <p>{props.operationsDone()} out of {props.operations()} operations done</p>
    <Show when={props.shouldStop()}>
      <p>Aborted!</p>
    </Show>
    <Show when={props.errors().length > 0}>
      <p class={styles.error}>
        <For each={props.errors()}>{(errorText, index) => {
          return (<>
            <Show when={index() !== 0}><br /></Show>
            {errorText}
          </>)
        }}</For>
      </p>
    </Show>
    <p>{props.isDone() ? 'Done!' : props.currentStep()}</p>
    <Show when={!props.isDone()}>
      <button class={cn(seasonalPanelStyle.button, seasonalPanelStyle.destructive)}
              onClick={() => props.setShouldStop(true)}>
        Abort
      </button>
    </Show>
    <Show when={props.isDone()}>
      <button class={cn(seasonalPanelStyle.button, seasonalPanelStyle.primary)}
              onClick={() => {
                props.signals.setOpen(false)
                location.reload()
              }}>
        Refresh page
      </button>
    </Show>
  </>)
}
