# Greasy Fork listing text

Paste the block below into the **Additional info** field when posting or editing the
script on Greasy Fork. Greasy Fork renders Markdown there.

Greasy Fork keeps a separate description per language: post the English block under the
`en` locale and the Traditional Chinese block under `zh-TW`. The script's `@name` /
`@description` (and `@name:zh-TW` / `@description:zh-TW`) already supply the short
title and one-line summary, so these blocks only need the details.

---

## English (locale: en)

Switch between Facebook Messages / Messenger conversations from the keyboard, and start
typing immediately — the message box is focused for you.

### Shortcuts

With the default `HOTKEY_MODE = 'auto'`, `<mod>` is **Alt + Shift** on Linux and **Alt**
on Windows / macOS.

| Shortcut | Action |
| --- | --- |
| `<mod>` + `1` … `9` | Open the 1st – 9th conversation in the sidebar |
| `<mod>` + `↑` / `↓` | Previous / next conversation (wraps around) |

### Why the modifier differs per platform

- **Linux:** Chrome handles `Alt + <digit>` itself to switch tabs, so the page never
  sees the key — `Alt + Shift` is used instead.
- **Windows:** `Alt + Shift` is the system shortcut for switching keyboard layout, so
  plain `Alt` is the better default there.

Set `HOTKEY_MODE` to `'alt'`, `'alt-shift'` or `'both'` at the top of the script to
override the detection.

### Details

- The composer is focused after switching, with the caret placed at the end of any
  existing draft, and focus is not pulled back if you have clicked into another field.
- Digits are read from `event.code` (the physical key), so IMEs such as Zhuyin or Pinyin
  do not break the shortcut. The number row and the numeric keypad both work.
- Keys are handled in the capture phase, before the site's own shortcuts.
- A small toast confirms which conversation was opened.
- The chat list, the active conversation and the composer are each located through
  several fallback strategies, so the script survives minor Facebook UI changes.

### Settings

Edit the `===== Settings =====` block at the top of the script:

| Setting | Default | Purpose |
| --- | --- | --- |
| `HOTKEY_MODE` | `'auto'` | Modifier combination |
| `AUTO_FOCUS_INPUT` | `true` | Focus the message box after switching |
| `FOCUS_TIMEOUT` | `4000` | How long to wait for the new composer, in ms |
| `SHOW_TOAST` | `true` | Show the on-screen confirmation |
| `TEXTS` | English | Toast strings, collected in one object |

### Source and issues

- Source: https://github.com/ernuolien/messenger-alt-chat-switcher
- Issues: https://github.com/ernuolien/messenger-alt-chat-switcher/issues
- License: MIT

---

## 繁體中文（locale: zh-TW）

用鍵盤切換 Facebook Messages／Messenger 的聊天室，切換後自動聚焦訊息輸入框，可以直接開始打字。

### 快捷鍵

預設 `HOTKEY_MODE = 'auto'` 下，`<mod>` 在 Linux 是 **Alt + Shift**，在 Windows／macOS 是 **Alt**。

| 按鍵 | 動作 |
| --- | --- |
| `<mod>` + `1` ~ `9` | 開啟清單中第 1 ~ 9 個聊天室 |
| `<mod>` + `↑` / `↓` | 上一個／下一個聊天室（可循環） |

### 為什麼組合鍵依平台不同

- **Linux**：Chrome 會自己吃掉 `Alt + 數字` 用來切換分頁，網頁收不到按鍵，所以改用 `Alt + Shift`。
- **Windows**：`Alt + Shift` 是系統切換鍵盤配置的快捷鍵，所以預設用單純的 `Alt`。

想自己指定的話，把腳本最上方的 `HOTKEY_MODE` 改成 `'alt'`、`'alt-shift'` 或 `'both'`。

### 細節

- 切換後自動 focus 訊息輸入框，游標落在既有草稿的最後面；若你已經點到其他欄位，腳本不會把焦點搶回來。
- 以 `event.code`（實體按鍵）判斷數字，不受注音、拼音等輸入法影響；主鍵盤數字鍵與數字鍵盤皆可。
- 在 capture 階段處理按鍵，優先於網站本身的快捷鍵。
- 以小提示（toast）顯示切換到哪一個聊天室。
- 聊天室清單、目前聊天室、訊息輸入框都有多組選擇器後備機制，Facebook 介面小改版時仍可運作。

### 設定

修改腳本最上方的 `===== Settings =====` 區塊：

| 設定 | 預設值 | 用途 |
| --- | --- | --- |
| `HOTKEY_MODE` | `'auto'` | 組合鍵模式 |
| `AUTO_FOCUS_INPUT` | `true` | 切換後是否自動聚焦輸入框 |
| `FOCUS_TIMEOUT` | `4000` | 等待新輸入框出現的最長毫秒數 |
| `SHOW_TOAST` | `true` | 是否顯示畫面上的提示 |
| `TEXTS` | 英文 | toast 文字，集中在一個物件裡 |

### 原始碼與問題回報

- 原始碼：https://github.com/ernuolien/messenger-alt-chat-switcher
- 問題回報：https://github.com/ernuolien/messenger-alt-chat-switcher/issues
- 授權：MIT
