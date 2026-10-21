# Which vim Ctrl and special keys can a browser page intercept?

Ticket: [#4](https://github.com/Lintilla-418954/AiProject6/issues/4). Sources read 2026-10-21 (Chromium `main`, Firefox `main`, current WHATWG/WICG specs, MDN and browser-compat-data).

## Answer in one line

On Windows/Linux, `Ctrl-W`, `Ctrl-N` and `Ctrl-T` are hard-reserved by Chrome, Edge and Firefox and cannot be captured. Every other key on the list can be captured with `keydown` + `preventDefault()` in every target browser and OS, as long as the page is **not fullscreen** (fullscreen `Esc` is reserved). On macOS all of the listed `Ctrl` keys are free, because browser shortcuts live on `Cmd`.

## Mechanism

Browsers split their shortcuts into two classes:

- **Reserved.** The browser handles these before the page, so `preventDefault()` has no effect.
  - Chromium: `IsReservedCommandOrKey()` returns true for the commands in `kReservedCommandIds`: `IDC_CLOSE_TAB`, `IDC_CLOSE_WINDOW`, `IDC_NEW_INCOGNITO_WINDOW`, `IDC_NEW_ISOLATED_WINDOW`, `IDC_NEW_TAB`, `IDC_NEW_WINDOW`, `IDC_RESTORE_TAB`, `IDC_SELECT_NEXT_TAB`, `IDC_SELECT_PREVIOUS_TAB`, `IDC_CYCLE_TO_NEXT_TAB`, `IDC_CYCLE_TO_PREV_TAB` and `IDC_EXIT` ([accelerator_table.cc](https://chromium.googlesource.com/chromium/src/+/main/chrome/browser/ui/accelerator_table.cc), [browser_command_controller.cc](https://chromium.googlesource.com/chromium/src/+/main/chrome/browser/ui/browser_command_controller.cc)).
  - Firefox: `<key ... reserved="true">` entries in [browser-sets.inc.xhtml](https://github.com/mozilla-firefox/firefox/blob/main/browser/base/content/browser-sets.inc.xhtml) are always reserved. Other keys are reserved only when the site's `shortcuts` permission is set to DENY ([GlobalKeyListener.cpp `IsReservedKey`](https://github.com/mozilla-firefox/firefox/blob/main/dom/events/GlobalKeyListener.cpp), [nsContentUtils.cpp `ShouldBlockReservedKeys`](https://github.com/mozilla-firefox/firefox/blob/main/dom/base/nsContentUtils.cpp)). The reserved entries are new window (`accel+N`), new tab (`accel+T`), close tab (`accel+W`), close window (`accel+Shift+W`), private window (`accel+Shift+P`), quit, and the fullscreen-exit keys.
- **Non-reserved.** These include Find, Reload, Bookmark, View Source, Open File and Print, plus editing defaults like paste and select-all. The page receives `keydown` first, and `preventDefault()` cancels the browser action.

`accel` / `EF_PLATFORM_ACCELERATOR` means **Ctrl on Windows/Linux and Cmd on macOS**. As a result, macOS browsers do not bind `Ctrl+letter` to the browser shortcuts above.

Edge is Chromium and uses the same reserved-command logic. Edge-only extra shortcuts were not checked against a primary source. Safari is closed source, so its rows rely on the macOS rule that app shortcuts use `Cmd`. Verify Safari and Edge in the manual test pass (see "Open items").

## Supported / unsupported table

Key: **Yes** = page sees `keydown` and `preventDefault()` suppresses the browser action. **No** = reserved by the browser.

| Vim key | Chrome / Edge Win+Linux | Firefox Win+Linux | Chrome / Edge / Firefox / Safari macOS | What preventDefault suppresses | Verdict |
|---|---|---|---|---|---|
| `Ctrl-R` | Yes | Yes | Yes | Reload (not reserved in either engine) | Supported |
| `Ctrl-V` | Yes | Yes | Yes | Paste (editing default) | Supported |
| `Ctrl-A` | Yes | Yes | Yes | Select all | Supported |
| `Ctrl-X` | Yes | Yes | Yes | Cut | Supported |
| `Ctrl-D` | Yes | Yes | Yes | Bookmark page (not reserved) | Supported |
| `Ctrl-U` | Yes | Yes | Yes | View source (not reserved) | Supported |
| `Ctrl-O` | Yes | Yes | Yes | Open file (not reserved) | Supported |
| `Ctrl-I` | Yes | Yes | Yes | Firefox Page Info (not reserved) | Supported |
| `Ctrl-E` | Yes | Yes | Yes | Focus search bar (not reserved) | Supported |
| `Ctrl-Y` | Yes | Yes | Yes | Redo / history (not reserved) | Supported |
| `Ctrl-F` | Yes | Yes | Yes | Find (not reserved) | Supported |
| `Ctrl-B` | Yes | Yes | Yes | Firefox bookmarks sidebar (not reserved) | Supported |
| `Ctrl-[` | Yes | Yes | Yes | Firefox Back on Linux (`accel+[`, `XP_UNIX`, not reserved) | Supported, with a layout caveat (below) |
| `Tab` | Yes | Yes | Yes | Focus navigation | Supported |
| `Esc` (windowed) | Yes | Yes | Yes | Stop loading / close find bar (not reserved) | Supported |
| `Esc` (fullscreen) | No | No | No | Exits fullscreen | Unsupported, unless Keyboard Lock is used (below) |
| `Ctrl-W` | **No** | **No** | Yes | Close tab (reserved) | **Unsupported** |
| `Ctrl-N` | **No** | **No** | Yes | New window (reserved) | **Unsupported** |
| `Ctrl-T` | **No** | **No** | Yes | New tab (reserved) | **Unsupported** |

Related keys that are also reserved on Windows/Linux, for reference: `Ctrl-Shift-N`, `Ctrl-Shift-T`, `Ctrl-Shift-W`, `Ctrl-Tab`, `Ctrl-Shift-Tab`, `Ctrl-PgUp`, `Ctrl-PgDn` and `Ctrl-F4` (Chromium), and `Ctrl-Shift-P` (Firefox).

Because the game must behave the same on every OS, treat `Ctrl-W`, `Ctrl-N` and `Ctrl-T` as unsupported everywhere, even though macOS would deliver them.

## Esc, fullscreen and Keyboard Lock

- Chromium: when the window is fullscreen, every command except `IDC_FULLSCREEN` and `IDC_EXIT` goes to the page, so in fullscreen even `Ctrl-W` reaches the page ([browser_command_controller.cc](https://chromium.googlesource.com/chromium/src/+/main/chrome/browser/ui/browser_command_controller.cc), crbug 40501396). `Esc` still exits page-requested fullscreen. The page gets the event but cannot cancel the exit, unless it has called `navigator.keyboard.lock(["Escape"])`. With that lock, the user must hold `Esc` for 2 seconds to exit ([Keyboard Lock spec](https://wicg.github.io/keyboard-lock/)).
- `navigator.keyboard.lock()` is supported in Chrome 68+ and Edge only. Firefox and Safari do not support it ([BCD api/Keyboard.json](https://github.com/mdn/browser-compat-data/blob/main/api/Keyboard.json)).
- The Fullscreen spec now has `requestFullscreen({ keyboardLock: "browser" })`. User agents that support it use a long `Esc` press to exit ([Fullscreen API](https://fullscreen.spec.whatwg.org/)). Support: Firefox 151, Safari 26.4, not yet Chrome (crbug 505427218) ([BCD api/Element.json](https://github.com/mdn/browser-compat-data/blob/main/api/Element.json)). Firefox's implementation is in [PresShell.cpp](https://github.com/mozilla-firefox/firefox/blob/main/layout/base/PresShell.cpp) (long-press `Esc`) and `GlobalKeyListener::IsReservedKey`, which forwards reserved shortcuts to the page except `View:FullScreen`.
- **Implication:** do not run Puzzles fullscreen. In a normal window, `Esc` is a plain, cancellable key in every browser. Fullscreen plus a lock could in theory unlock `Ctrl-W`, `Ctrl-N` and `Ctrl-T`, but it needs two different APIs depending on the browser and adds hold-`Esc` UX. Not worth it.

## Caveats for the engine

1. **`Ctrl-[` depends on the keyboard layout.** It is only "`Ctrl` + the `[` key" where `[` is unshifted (e.g. US/UK). On layouts like German, `[` needs AltGr, so `Ctrl-[` is impractical. Treat `Esc` as canonical and `Ctrl-[` as an alias. Match on `event.code === "BracketLeft"` with `ctrlKey`, and also on `event.key === "["`.
2. **Linux keytheme exception.** Chromium on Linux un-reserves a key if the GTK key theme maps it to a text-edit command (`IsReservedCommandOrKey`, `IS_LINUX` branch). Firefox has a similar edit-command exception in `IsReservedKey`. This only happens for users with an Emacs keytheme, so the default stays "reserved".
3. **macOS Cmd.** Use `event.ctrlKey` for vim `Ctrl` chords and ignore `metaKey` chords. Pass `Cmd-*` through to the browser so `Cmd-W`, `Cmd-Q` and `Cmd-R` behave as the player expects. Mac players will press the physical Control key for vim chords, which no macOS browser binds to the listed keys.
4. **IME and dead keys.**
   - While an IME is composing, `keydown` still fires with `isComposing === true` or `keyCode === 229`. Ignore these events in normal mode ([MDN keydown_event](https://developer.mozilla.org/en-US/docs/Web/API/Element/keydown_event)).
   - A dead key reports `event.key === "Dead"` ([MDN KeyboardEvent.key](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key)). On US-International and many European layouts, `'` `"` `` ` `` `^` `~` are dead keys, and these are vim keys (registers, marks, `~`, `^`).
   - Recommendation: capture input through a focused hidden `<textarea>`. Take commands from `keydown` for named keys and `Ctrl` chords. For printable characters, fall back to the composed text from `input`/`beforeinput` when `key` is `"Dead"` or the event is composing. Show a hint suggesting a non-dead-key layout.
5. **Never count reserved chords.** On Windows/Linux the page may never receive a `keydown` for `Ctrl-W`, `Ctrl-N` or `Ctrl-T`, so the engine cannot nudge the player about them. That is another reason to keep them out of the curriculum.

## Open items (not verified from primary source)

- Safari's exact reserved list: WebKit/Safari UI source is not public. Inferred from macOS `Cmd` conventions.
- Edge-specific added accelerators beyond Chromium's.
- Confirm in a 5-minute manual test page on each browser before the curriculum is frozen.
