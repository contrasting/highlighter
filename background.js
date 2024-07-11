// https://developer.chrome.com/docs/extensions/develop/ui/context-menu

chrome.runtime.onInstalled.addListener(async () => {
    chrome.contextMenus.create({
        id: "highlighter_highlight",
        title: "Highlighter highlight",
        type: 'normal',
        contexts: ['selection']
    });
    chrome.contextMenus.create({
        id: "highlighter_export",
        title: "Highlighter export",
        type: "normal",
        contexts: ["action"]
    });
});

chrome.contextMenus.onClicked.addListener(async (item, tab) => {
    if (item.menuItemId === "highlighter_highlight") {

        const url = tab.url;

        // https://developer.chrome.com/docs/extensions/reference/api/storage#examples
        const highlights = (await chrome.storage.local.get(url))[url] ?? [];

        await chrome.storage.local.set({
            [url]: [item.selectionText, ...highlights]
        })
    } else if (item.menuItemId === "highlighter_export") {
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
    }
});