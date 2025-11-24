import style from './spinner.module.scss'

export function Spinner(props: { centered?: true }) {
  const svg = (
    <svg class={style.spinner} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill={'none'}>
      <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2" />
    </svg>
  )

  if (props.centered) {
    return (
      <div class={style.centered}>{svg}</div>
    )
  } else return svg
}
