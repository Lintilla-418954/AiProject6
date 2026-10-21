export type KeyToken = string;

const CANONICAL_SPECIAL = new Map([
  ["esc", "<Esc>"],
  ["escape", "<Esc>"],
  ["cr", "<CR>"],
  ["enter", "<CR>"],
  ["bs", "<BS>"],
  ["backspace", "<BS>"],
  ["tab", "<Tab>"],
  ["space", " "],
]);

export function normalizeToken(raw: string): KeyToken {
  if (raw.length === 1) return raw;
  if (!raw.startsWith("<") || !raw.endsWith(">"))
    throw new Error(`Invalid key token: ${raw}`);
  const body = raw.slice(1, -1);
  const special = CANONICAL_SPECIAL.get(body.toLowerCase());
  if (special) return special;
  const control = /^c-(.)$/i.exec(body);
  if (control) return `<C-${control[1]!.toLowerCase()}>`;
  throw new Error(`Unsupported key token: ${raw}`);
}

export function parseKeys(notation: string): KeyToken[] {
  const tokens: KeyToken[] = [];
  for (let index = 0; index < notation.length; index++) {
    if (notation[index] === "<") {
      const close = notation.indexOf(">", index + 1);
      if (close >= 0) {
        tokens.push(normalizeToken(notation.slice(index, close + 1)));
        index = close;
        continue;
      }
    }
    tokens.push(notation[index]!);
  }
  return tokens;
}

export function formatKeys(tokens: readonly KeyToken[]): string {
  return tokens.join("");
}

export function isPrintableToken(token: string): boolean {
  return (
    token.length === 1 &&
    token.charCodeAt(0) >= 32 &&
    token.charCodeAt(0) <= 126
  );
}
