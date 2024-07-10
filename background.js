// https://developer.chrome.com/docs/extensions/develop/ui/context-menu

chrome.runtime.onInstalled.addListener(async () => {
    chrome.contextMenus.create({
        id: "highlighter",
        title: "Highlighter highlight",
        type: 'normal',
        contexts: ['selection']
    });
});

chrome.contextMenus.onClicked.addListener((item, tab) => {
    console.log(tab.url)
    console.log(item.selectionText);
});