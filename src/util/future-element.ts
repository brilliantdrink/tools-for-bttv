export function queryFutureElement<K extends keyof HTMLElementTagNameMap>(selectors: K): Promise<HTMLElementTagNameMap[K]>;
export function queryFutureElement<K extends keyof SVGElementTagNameMap>(selectors: K): Promise<SVGElementTagNameMap[K]>;
export function queryFutureElement<K extends keyof MathMLElementTagNameMap>(selectors: K): Promise<MathMLElementTagNameMap[K]>;
export function queryFutureElement<E extends Element = Element>(selector: string): Promise<E>
export function queryFutureElement<E extends Element = Element>(selector: string): Promise<E> {
  return new Promise<E>(resolve => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector) as E);
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector) as E);
      }
    });

    observer.observe(document.body, {childList: true, subtree: true});
  });
}

export async function* queryFutureElements(selector: string, options?: {timeout?: number, abort?: AbortSignal}) {
  const yielded: Element[] = []
  let lastYield = performance.now()
  let abort = false
  if (options && options.abort) options.abort.onabort = () => abort = true
  const timeout = options?.timeout ?? 3_000
  do {
    if (abort || performance.now() - lastYield > timeout) break
    const matches = document.querySelectorAll(selector)
    for (const element of matches) {
      if (yielded.includes(element)) continue
      yielded.push(element)
      lastYield = performance.now()
      yield element;
    }
  } while (await new Promise(resolve => setTimeout(() => resolve(true), 50)))
}
