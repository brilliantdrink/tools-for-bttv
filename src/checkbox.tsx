import {Accessor, Setter, Show} from 'solid-js'
import cn from 'classnames'

import styles from './checkbox.module.scss'

export function Checkbox(props: {
  class?: string,
  checked: Accessor<boolean>,
  setChecked: Setter<boolean>,
  label?: string,
  hint?: string
}) {
  return (
    <label class={cn(styles.checkbox, props.class)}>
      <input type="checkbox" on:change={e => props.setChecked(e.target.checked)}
             checked={props.checked()} />
      <span class={cn(styles.control, props.checked() && styles.checked)}>
        <Show when={props.checked()}>
          <div style="display: flex; align-items: center; justify-content: center; height: 100%;">
            <svg viewBox="0 0 12 10"
                 style="fill: none; stroke-width: 2px; stroke: currentcolor; stroke-dasharray: 16px;">
              <polyline points="1.5 6 4.5 9 10.5 1"></polyline>
            </svg>
          </div>
        </Show>
      </span>
      <Show when={props.label}>
        <span class={styles.label}>{props.label}</span>
      </Show>
      <Show when={props.hint}>
        <span class={styles.hint}>{props.hint}</span>
      </Show>
    </label>
  )
}
