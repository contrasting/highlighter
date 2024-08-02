// https://developer.chrome.com/docs/extensions/develop/ui/context-menu

const HIGHLIGHT = "highlighter_highlight";
const STRIKETHROUGH = "highlighter_strikethrough";
const EXPORT = "highlighter_export";
const IMPORT = "highlighter_import";

chrome.runtime.onInstalled.addListener(async () => {
    chrome.contextMenus.create({
        id: HIGHLIGHT,
        title: "Highlight '%s'",
        type: 'normal',
        contexts: ['selection']
    });
    chrome.contextMenus.create({
        id: STRIKETHROUGH,
        title: "Strikethrough '%s'",
        type: "normal",
        contexts: ['selection']
    });
    chrome.contextMenus.create({
        id: EXPORT,
        title: "Export",
        type: "normal",
        contexts: ["action"]
    });
    chrome.contextMenus.create({
        id: IMPORT,
        title: "Import",
        type: "normal",
        contexts: ["action"]
    });
});

chrome.contextMenus.onClicked.addListener(async (item, tab) => {
    if (item.menuItemId === HIGHLIGHT) {
        await chrome.tabs.sendMessage(tab.id, "highlight");
    } else if (item.menuItemId === STRIKETHROUGH) {
        await chrome.tabs.sendMessage(tab.id, "strikethrough");
    } else if (item.menuItemId === EXPORT) {
        // https://stackoverflow.com/questions/23160600/chrome-extension-local-storage-how-to-export
        chrome.storage.local.get(null, function(items) { // null implies all items
            // Convert object to a string.
            const result = JSON.stringify(items);

            // Save as file https://stackoverflow.com/questions/23223718/failed-to-execute-btoa-on-window-the-string-to-be-encoded-contains-characte
            const url = 'data:application/json;base64,' + btoa(unescape(encodeURIComponent(result)));
            chrome.downloads.download({
                url: url,
                filename: 'highlighter_export.json'
            });
        });
    } else if (item.menuItemId === IMPORT) {
        await chrome.tabs.sendMessage(tab.id, "import");
    }
});