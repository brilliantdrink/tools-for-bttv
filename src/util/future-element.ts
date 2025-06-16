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
