export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export function button(
  label: string,
  action: () => void,
  className?: string,
): HTMLButtonElement {
  const element = el("button", className, label);
  element.type = "button";
  element.addEventListener("click", action);
  return element;
}

export function routeLink(
  label: string,
  route: string,
  className?: string,
): HTMLAnchorElement {
  const element = el("a", className, label);
  element.href = `#${route}`;
  return element;
}

export function replace(root: HTMLElement, ...children: Node[]): void {
  root.replaceChildren(...children);
}
