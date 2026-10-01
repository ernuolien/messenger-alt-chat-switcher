// ==UserScript==
// @name         FB/Messenger Chat Switcher
// @namespace    https://github.com/ernuolien/messenger-alt-chat-switcher
// @version      3.1.0
// @description  Switch Facebook Messages / Messenger chats with Alt(+Shift)+1-9 and Alt(+Shift)+Up/Down, then focus the composer
// @author       ernuolien
// @match        *://*.facebook.com/messages
// @match        *://*.facebook.com/messages/*
// @match        *://*.messenger.com/*
// @grant        none
// @run-at       document-idle
// @homepageURL  https://github.com/ernuolien/messenger-alt-chat-switcher
// @downloadURL  https://raw.githubusercontent.com/ernuolien/messenger-alt-chat-switcher/main/messenger-alt-chat-switcher.user.js
// @updateURL    https://raw.githubusercontent.com/ernuolien/messenger-alt-chat-switcher/main/messenger-alt-chat-switcher.user.js
// ==/UserScript==

(function () {
    'use strict';

    // ===== Settings =====

    // Which modifier combination triggers the shortcuts:
    //   'auto'      - Alt+Shift on Linux, plain Alt everywhere else (see the note below)
    //   'alt'       - Alt + digit / Alt + arrow
    //   'alt-shift' - Alt + Shift + digit / Alt + Shift + arrow
    //   'both'      - accept either combination
    //
    // Why the platform split: on Linux, Chrome handles Alt+<digit> itself to jump
    // between tabs and the page never sees the key, so Alt+Shift is needed there.
    // On Windows, Alt+Shift is the system shortcut for switching keyboard layout,
    // so plain Alt is the better default.
    const HOTKEY_MODE = 'auto';

    const AUTO_FOCUS_INPUT = true;   // Focus the message box after switching
    const FOCUS_TIMEOUT = 4000;      // Max time to wait for the new composer to appear (ms)
    const SHOW_TOAST = true;         // Show the small on-screen confirmation

    // On-screen texts, kept in one place so they are easy to translate
    const TEXTS = {
        noChatList: '⚠️ Chat list not found',
        outOfRange: (n, total) => `⚠️ No chat #${n} (${total} in the list)`,
        switched: (name) => `💬 ${name}`,
        switchedDown: (name) => `💬 ⬇ ${name}`,
        switchedUp: (name) => `💬 ⬆ ${name}`,
    };

    // ===== Hotkey matching =====

    function isLinux() {
        const uaData = navigator.userAgentData;
        const platform = (uaData && uaData.platform) || navigator.platform || '';
        const ua = navigator.userAgent || '';
        if (/Android/i.test(ua)) return false; // Android reports as Linux
        return /Linux|X11/i.test(platform) || /Linux|X11/i.test(ua);
    }

    const requireShift = HOTKEY_MODE === 'alt-shift' || (HOTKEY_MODE === 'auto' && isLinux());

    function isHotkey(e) {
        if (!e.altKey || e.ctrlKey || e.metaKey) return false;
        if (HOTKEY_MODE === 'both') return true;
        return requireShift ? e.shiftKey : !e.shiftKey;
    }

    // Read the digit from e.code (the physical key), so IMEs such as Zhuyin
    // and Alt/Shift-modified characters do not interfere
    function getDigit(e) {
        const match = (e.code || '').match(/^(?:Digit|Numpad)([1-9])$/);
        return match ? parseInt(match[1], 10) : null;
    }

    // ===== Chat list =====

    // Facebook's DOM changes often, so each lookup below tries several strategies.
    // Chinese strings in the selectors are Facebook's own UI labels, not translatable text.

    function findChatListContainer() {
        const navs = document.querySelectorAll('[role="navigation"]');
        for (const nav of navs) {
            if (nav.querySelector('a[href*="/messages/"]')) return nav;
        }

        // Fall back to any list/grid holding more than one conversation link
        const lists = document.querySelectorAll('[role="list"], [role="grid"]');
        for (const list of lists) {
            if (list.querySelectorAll('a[href*="/messages/"]').length >= 2) return list;
        }

        return null;
    }

    function getChatItems() {
        // Strategy 1: clickable rows of the conversation list
        let items = document.querySelectorAll('[role="row"] a[role="link"], [role="listitem"] a[role="link"]');
        if (items.length > 0) {
            const chatList = findChatListContainer();
            if (chatList) {
                items = Array.from(items).filter(item => chatList.contains(item));
            }
            if (items.length > 0) return Array.from(items);
        }

        // Strategy 2: conversation links, filtered by size to skip other navigation
        items = document.querySelectorAll('a[href*="/messages/"][role="link"]');
        if (items.length > 0) {
            const sized = Array.from(items).filter(item => {
                const rect = item.getBoundingClientRect();
                return rect.width > 100 && rect.height > 30;
            });
            if (sized.length > 0) return sized;
        }

        // Strategy 3: anything inside the navigation region
        const nav = document.querySelector('[role="navigation"]');
        if (nav) {
            items = nav.querySelectorAll('a[href*="/messages/"]');
            if (items.length > 0) return Array.from(items);
        }

        // Strategy 4: looser attribute/class based selectors
        items = document.querySelectorAll('[data-testid*="chat"] a, [class*="chat"] a[href*="/messages/"]');
        if (items.length > 0) return Array.from(items);

        return [];
    }

    function getCurrentChatIndex(chatItems) {
        // 1: aria-current marks the active row
        for (let i = 0; i < chatItems.length; i++) {
            const current = chatItems[i].getAttribute('aria-current');
            if (current === 'page' || current === 'true') return i;
        }

        // 2: match the link against the current URL
        const currentPath = window.location.pathname.replace(/\/$/, '');
        for (let i = 0; i < chatItems.length; i++) {
            const href = (chatItems[i].getAttribute('href') || '').replace(/\/$/, '');
            if (href && (href === currentPath || currentPath.includes(href))) return i;
        }

        // 3: fall back to the row whose background differs from its neighbour
        for (let i = 0; i < chatItems.length; i++) {
            const el = chatItems[i].closest('[role="row"]') || chatItems[i];
            const bg = window.getComputedStyle(el).backgroundColor;
            if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && bg !== 'rgb(255, 255, 255)') {
                const neighbour = chatItems[i === 0 ? 1 : 0] || chatItems[i];
                const neighbourEl = neighbour.closest('[role="row"]') || neighbour;
                if (bg !== window.getComputedStyle(neighbourEl).backgroundColor) return i;
            }
        }

        return -1;
    }

    function getChatName(element) {
        const label = element.getAttribute('aria-label');
        if (label) return label;

        // Otherwise take the first span that looks like a name rather than a timestamp
        const timestamp = /^\d+\s*[分時天月週]|^昨天|^星期|^\d+\s*(m|h|d|w|y)$|^Yesterday/i;
        for (const span of element.querySelectorAll('span')) {
            const text = span.textContent.trim();
            if (text && text.length < 50 && !timestamp.test(text)) return text;
        }

        return '';
    }

    function clickChat(element) {
        if (!element) return false;

        // A full mouse sequence is more reliable than element.click() on React rows.
        // Only this sequence is dispatched, so the chat is never opened twice.
        for (const type of ['mousedown', 'mouseup', 'click']) {
            element.dispatchEvent(new MouseEvent(type, {
                bubbles: true,
                cancelable: true,
                view: window
            }));
        }

        return true;
    }

    // ===== Composer focus =====

    function isVisible(el) {
        if (!el || !el.isConnected) return false;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        const style = window.getComputedStyle(el);
        return style.visibility !== 'hidden' && style.display !== 'none';
    }

    // The composer is a contenteditable div (role="textbox"). Prefer the one inside
    // role="main" so docked chat windows and the search box are not picked up.
    function findMessageInput() {
        const selectors = [
            '[role="main"] div[contenteditable="true"][role="textbox"]',
            '[role="main"] div[contenteditable="true"]',
            'div[contenteditable="true"][role="textbox"][aria-label]',
            'div[contenteditable="true"][role="textbox"]',
        ];

        for (const selector of selectors) {
            const candidates = Array.from(document.querySelectorAll(selector)).filter(isVisible);
            // The composer sits at the bottom of the page, so take the last match
            if (candidates.length > 0) return candidates[candidates.length - 1];
        }

        return null;
    }

    // Put the caret after any existing draft, so typing continues it
    function placeCaretAtEnd(el) {
        try {
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } catch (_) {
            // Ignore: focus() already worked, only the caret position is lost
        }
    }

    let focusJobId = 0;

    // Focus the composer, then verify a few times: Facebook sometimes steals
    // focus once the conversation has finished rendering
    function doFocus(jobId, attempt) {
        if (jobId !== focusJobId) return; // Superseded by a newer switch
        const input = findMessageInput();
        if (!input) return;

        input.focus({ preventScroll: true });
        placeCaretAtEnd(input);

        if (attempt < 3) {
            setTimeout(() => {
                if (jobId !== focusJobId) return;
                const current = findMessageInput();
                const active = document.activeElement;
                // Never pull focus back if the user has moved to another field
                const userIsEditingElsewhere = active && active !== current &&
                    (active.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName));
                if (current && active !== current && !userIsEditingElsewhere) {
                    doFocus(jobId, attempt + 1);
                }
            }, 250);
        }
    }

    /**
     * Wait for the new conversation's composer, then focus it.
     * @param {string} prevPath - URL path before the switch
     * @param {Element|null} prevInput - composer element before the switch
     */
    function focusInputAfterSwitch(prevPath, prevInput) {
        if (!AUTO_FOCUS_INPUT) return;

        const jobId = ++focusJobId;
        const start = Date.now();
        let pathChangedAt = null;

        const tick = () => {
            if (jobId !== focusJobId) return;
            const now = Date.now();

            if (pathChangedAt === null && window.location.pathname !== prevPath) {
                pathChangedAt = now;
            }

            const input = findMessageInput();
            let ready = false;
            if (input) {
                if (input !== prevInput) {
                    // The new conversation's composer has been created
                    ready = true;
                } else if (pathChangedAt !== null && now - pathChangedAt > 500) {
                    // URL changed but Facebook reused the same composer element
                    ready = true;
                } else if (pathChangedAt === null && now - start > 800) {
                    // URL never changed (e.g. the chat was already open)
                    ready = true;
                }
            }

            if (ready) {
                // Small delay so the conversation finishes rendering first
                setTimeout(() => doFocus(jobId, 0), 100);
                return;
            }

            if (now - start < FOCUS_TIMEOUT) setTimeout(tick, 100);
        };

        tick();
    }

    // ===== Switching =====

    function switchToChat(index) {
        const chatItems = getChatItems();
        if (chatItems.length === 0) {
            showToast(TEXTS.noChatList, 'warn');
            return;
        }

        if (index < 0 || index >= chatItems.length) {
            showToast(TEXTS.outOfRange(index + 1, chatItems.length), 'warn');
            return;
        }

        const target = chatItems[index];
        const prevPath = window.location.pathname;
        const prevInput = findMessageInput();

        clickChat(target);
        focusInputAfterSwitch(prevPath, prevInput);

        showToast(TEXTS.switched(getChatName(target) || `#${index + 1}`));
    }

    // direction: -1 for the previous chat, +1 for the next one (wraps around)
    function switchRelative(direction) {
        const chatItems = getChatItems();
        if (chatItems.length === 0) {
            showToast(TEXTS.noChatList, 'warn');
            return;
        }

        let currentIndex = getCurrentChatIndex(chatItems);
        if (currentIndex === -1) currentIndex = 0; // Active chat unknown: start from the top

        let newIndex = currentIndex + direction;
        if (newIndex < 0) newIndex = chatItems.length - 1;
        if (newIndex >= chatItems.length) newIndex = 0;

        const target = chatItems[newIndex];
        const prevPath = window.location.pathname;
        const prevInput = findMessageInput();

        clickChat(target);
        focusInputAfterSwitch(prevPath, prevInput);

        const name = getChatName(target) || `#${newIndex + 1}`;
        showToast(direction > 0 ? TEXTS.switchedDown(name) : TEXTS.switchedUp(name));
    }

    // ===== Toast =====

    let toastTimer = null;

    function showToast(message, type = 'info') {
        if (!SHOW_TOAST) return;

        let toast = document.getElementById('fb-chat-switcher-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'fb-chat-switcher-toast';
            Object.assign(toast.style, {
                position: 'fixed',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '8px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                zIndex: '999999',
                transition: 'opacity 0.3s ease',
                pointerEvents: 'none',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            });
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.opacity = '1';
        toast.style.backgroundColor = type === 'warn' ? '#f0ad4e' : '#1877f2';
        toast.style.color = type === 'warn' ? '#333' : '#fff';

        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { toast.style.opacity = '0'; }, 1500);
    }

    // ===== Key handling =====

    // Capture phase, so the shortcut is handled before the page's own handlers
    document.addEventListener('keydown', function (e) {
        if (!isHotkey(e)) return;

        const digit = getDigit(e);
        if (digit !== null) {
            e.preventDefault();
            e.stopPropagation();
            switchToChat(digit - 1); // Shortcuts are 1-based, the list is 0-based
            return;
        }

        if (e.code === 'ArrowUp') {
            e.preventDefault();
            e.stopPropagation();
            switchRelative(-1);
            return;
        }

        if (e.code === 'ArrowDown') {
            e.preventDefault();
            e.stopPropagation();
            switchRelative(1);
        }
    }, true);

    // ===== Startup log =====

    const combo = HOTKEY_MODE === 'both' ? 'Alt(+Shift)' : (requireShift ? 'Alt+Shift' : 'Alt');
    console.log(`[FB Chat Switcher] loaded (hotkey mode: ${HOTKEY_MODE}${HOTKEY_MODE === 'auto' ? ` -> ${combo}` : ''})`);
    console.log(`[FB Chat Switcher] ${combo}+1~9: switch chat | ${combo}+Up/Down: previous/next | composer is focused afterwards`);

})();
