export type PickOnly<T, K extends keyof T> = Pick<T, K> & { [P in Exclude<keyof T, K>]?: never }
export type PickOneOnly<T> = PickOnly<T, never> | { [K in keyof T]-?: PickOnly<T, K> }[keyof T]
