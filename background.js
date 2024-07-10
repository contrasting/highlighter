// https://developer.chrome.com/docs/extensions/develop/ui/context-menu

chrome.runtime.onInstalled.addListener(async () => {
    chrome.contextMenus.create({
        id: "highlighter",
        title: "Highlighter highlight",
        type: 'normal',
        contexts: ['selection']
    });
});

chrome.contextMenus.onClicked.addListener(async (item, tab) => {
    const url = tab.url;

    // https://developer.chrome.com/docs/extensions/reference/api/storage#examples
    const highlights = (await chrome.storage.local.get(url))[url] ?? [];

    await chrome.storage.local.set({
        [url]: [item.selectionText, ...highlights]
    })
});