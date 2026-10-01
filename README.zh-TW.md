# FB/Messenger 聊天室快捷切換

[![點我安裝](https://img.shields.io/badge/Install-Tampermonkey-00485B?style=for-the-badge&logo=tampermonkey&logoColor=white)](https://raw.githubusercontent.com/ernuolien/messenger-alt-chat-switcher/main/messenger-alt-chat-switcher.user.js)

[English README](README.md)

一個給 Facebook Messages 與 Messenger 的 Tampermonkey 使用者腳本：用數字鍵跳到左側清單的第 1~9 個聊天室，用方向鍵切換上一個／下一個聊天室，切換後自動聚焦到訊息輸入框，按完快捷鍵就能直接打字。

## 特色

- `Alt + 1` ~ `Alt + 9` 開啟清單中對應的聊天室
- `Alt + ↑` / `Alt + ↓` 切換上一個／下一個聊天室，可循環
- 切換後自動 focus 訊息輸入框，游標落在既有草稿的最後面
- 以小提示（toast）顯示切換到哪一個聊天室
- 同一份腳本同時支援 Linux 與 Windows／macOS，詳見 [各平台快捷鍵](#各平台快捷鍵)
- 以 `event.code`（實體按鍵）判斷數字，不受注音等輸入法影響；主鍵盤數字鍵與數字鍵盤皆可
- 在 capture 階段處理按鍵，優先於網站本身的快捷鍵
- 聊天室清單、目前聊天室、輸入框都有多組選擇器後備機制，介面小改版時仍可運作

## 各平台快捷鍵

組合鍵依平台而異，預設的 `HOTKEY_MODE = 'auto'` 會自動選擇：

| 平台 | 組合鍵 | 原因 |
| --- | --- | --- |
| Linux | `Alt + Shift + …` | Linux 版 Chrome 會自己吃掉 `Alt + 數字` 用來切換分頁，網頁收不到按鍵 |
| Windows / macOS | `Alt + …` | Windows 的 `Alt + Shift` 是系統切換輸入法語言的快捷鍵 |

想自己指定的話，修改腳本最上方的 `HOTKEY_MODE`：

| 值 | 行為 |
| --- | --- |
| `'auto'` | Linux 用 Alt+Shift，其他平台用 Alt（預設） |
| `'alt'` | 一律使用 Alt |
| `'alt-shift'` | 一律使用 Alt+Shift |
| `'both'` | 兩種組合都接受 |

## 安裝

1. 在瀏覽器安裝 [Tampermonkey](https://www.tampermonkey.net/)（Chrome / Edge / Firefox 或其他 Chromium 系瀏覽器皆可）。
2. 點上方的安裝按鈕，或開啟[腳本的 raw 連結](https://raw.githubusercontent.com/ernuolien/messenger-alt-chat-switcher/main/messenger-alt-chat-switcher.user.js)，Tampermonkey 會顯示安裝頁面，確認安裝即可。
3. 重新整理 Messenger 或 Facebook 訊息頁面。

從這個網址安裝才會啟用自動更新：腳本有宣告 `@updateURL` / `@downloadURL`，
Tampermonkey 會定期檢查 `main` 上的版本，只要 `@version` 比本機新就會更新。
（若希望更新前先問你，可在 Tampermonkey 裡調整該腳本的更新設定。）

手動安裝方式：在 Tampermonkey 新增腳本，貼上
[`messenger-alt-chat-switcher.user.js`](messenger-alt-chat-switcher.user.js) 的內容。
這樣安裝的副本與倉庫沒有關聯，不會自動更新。

## 使用方式

預設的 `auto` 模式下，`<mod>` 在 Linux 是 `Alt + Shift`，在 Windows／macOS 是 `Alt`：

| 按鍵 | 動作 |
| --- | --- |
| `<mod> + 1` ~ `<mod> + 9` | 切換到清單中第 1 ~ 9 個聊天室 |
| `<mod> + ↑` | 上一個聊天室（到頂會跳到最後一個） |
| `<mod> + ↓` | 下一個聊天室（到底會跳回第一個） |

切換後腳本會等新聊天室的輸入框出現（最多 4 秒），自動 focus 並把游標放到草稿最後面。

## 設定

所有設定都在腳本最上方的 `// ===== Settings =====` 區塊：

| 設定 | 預設值 | 用途 |
| --- | --- | --- |
| `HOTKEY_MODE` | `'auto'` | 組合鍵模式，見上方表格 |
| `AUTO_FOCUS_INPUT` | `true` | 切換後是否自動聚焦輸入框 |
| `FOCUS_TIMEOUT` | `4000` | 等待新輸入框出現的最長毫秒數 |
| `SHOW_TOAST` | `true` | 是否顯示畫面上的提示 |
| `TEXTS` | 英文 | toast 文字，集中在一個物件裡方便改成中文 |

## 疑難排解

- **完全沒反應**：確認 Tampermonkey 已啟用腳本，且網址符合 `@match` 規則。Linux 記得要一起按 Shift；主控台（F12）的啟動訊息會顯示目前生效的組合鍵。
- **變成切換瀏覽器分頁**：那是 Linux 版 Chrome 吃掉了 `Alt + 數字`，請改用 `Alt + Shift`（Linux 預設）或設定 `HOTKEY_MODE = 'alt-shift'`。
- **變成切換鍵盤輸入法**：Windows 吃掉了 `Alt + Shift`，請設定 `HOTKEY_MODE = 'alt'`。
- **提示顯示找不到聊天列表**：Facebook 介面可能改版，請調整 `getChatItems()` 內的各組策略。
- **切換到錯誤的對話**：清單順序會隨新訊息變動，順序以畫面當下的清單為準。
- **沒有自動 focus 輸入框**：可調大 `FOCUS_TIMEOUT`，或調整 `findMessageInput()` 的選擇器。
- **`Alt + ↑/↓` 從錯誤的位置開始**：代表偵測不到目前的聊天室，腳本會從清單第一個開始；偵測邏輯在 `getCurrentChatIndex()`。

## 發佈到 Greasy Fork

Greasy Fork 會發佈自己的更新網址，所以上架的版本不能帶著指向 GitHub 的
`@downloadURL` / `@updateURL`，否則從 Greasy Fork 安裝的使用者之後會變成從 GitHub
更新。那份副本是用腳本產生的，不用手動維護：

```sh
node tools/build-greasyfork.mjs           # 產生 dist/messenger-alt-chat-switcher.greasyfork.user.js
node tools/build-greasyfork.mjs --check   # 產生的副本過期時回傳錯誤
```

- Greasy Fork 的 script sync 請指向產生出來的檔案：
  `https://raw.githubusercontent.com/ernuolien/messenger-alt-chat-switcher/main/dist/messenger-alt-chat-switcher.greasyfork.user.js`
- [`docs/greasyfork-description.md`](docs/greasyfork-description.md) 內含可直接貼到
  *Additional info* 欄位的說明文字（英文與繁體中文各一份）。
- 每次改動都要調高原始檔的 `@version` 再重新產生 — Greasy Fork 與 Tampermonkey 都是
  比較這個數字來決定要不要更新。

## 授權

見 [LICENSE](LICENSE)。
