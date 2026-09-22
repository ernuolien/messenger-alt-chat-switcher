// ==UserScript==
// @name         FB/Messenger Alt+N 快速切換聊天室 (Thorium 穩健版)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  支援 Facebook Messages 與 Messenger，修正輸入法衝突
// @author       Gemini
// @match        *://*.facebook.com/messages/*
// @match        *://*.messenger.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    console.log('--- 聊天室切換腳本已載入 (Thorium 版) ---');

    function getChatItems() {
        const possibleSelectors = [
            'div[role="navigation"] div[role="row"]',
            'div[role="grid"] div[role="row"]',
            'div[aria-label="聊天室"] div[role="row"]',
            'div[aria-label="Chats"] div[role="row"]',
            'a[href*="/messages/t/"]'
        ];

        for (let selector of possibleSelectors) {
            const items = Array.from(document.querySelectorAll(selector)).filter(el => {
                const r = el.getBoundingClientRect();
                return r.height > 20 && r.width > 30; // 排除無效的隱藏元素
            });
            if (items.length > 0) return items;
        }
        return [];
    }

    // Capture 模式攔截
    window.addEventListener('keydown', function(e) {

        // 使用 e.code 判斷實體按鍵，不受注音輸入法影響
        let keyNum = null;
        if (e.code && e.code.startsWith('Digit')) {
            keyNum = parseInt(e.code.replace('Digit', ''));
        } else if (e.code && e.code.startsWith('Numpad')) {
            keyNum = parseInt(e.code.replace('Numpad', ''));
        }

        // 判斷：按下 Alt，且按鍵是數字 1~9
        if (e.altKey && keyNum >= 1 && keyNum <= 9 && !e.ctrlKey && !e.shiftKey) {

            // 攔截預設行為
            e.preventDefault();
            e.stopImmediatePropagation();

            const index = keyNum - 1;
            const items = getChatItems();

            console.log(`[成功觸發] 按下 Alt+${keyNum}，目前抓到 ${items.length} 個聊天室`);

            if (items[index]) {
                const target = items[index].querySelector('a, [role="link"]') || items[index];

                // 模擬真實滑鼠點擊
                const clickEvent = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                target.dispatchEvent(clickEvent);

            } else {
                console.warn(`找不到第 ${keyNum} 個聊天室`);
            }
        }
    }, true);
})();
