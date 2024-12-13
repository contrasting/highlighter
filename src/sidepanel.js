// https://stackoverflow.com/questions/77276350/chrome-extension-how-to-show-the-active-tab-url-with-updates-when-it-changes

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.active) {
        setActiveUrl(tab.url);
    }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (tab.active) {
        setActiveUrl(tab.url);
    }
});

/* Set for initial active tab when open the sidepanel */
(async () => {
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    setActiveUrl(tab.url);
})();

function setActiveUrl(url) {
    const pageKey = getPageKey(url);
    document.querySelector("#activeUrl").innerHTML = pageKey;
    chrome.storage.local.get(pageKey).then(highlights => {
        const highlightsDiv = document.querySelector("#highlights");
        highlightsDiv.innerHTML = "";
        if (highlights[pageKey] == null || highlights[pageKey].length === 0) {
            highlightsDiv.innerHTML = "There are no highlights on this page.";
            return;
        }
        for (const h of highlights[pageKey]) {
            const p = document.createElement("p");
            const sub = document.createElement("sub");
            const hr = document.createElement("hr");
            // render emojis
            p.innerHTML = h.text;
            sub.innerHTML = `at ${new Date(h.time).toLocaleString()}`;
            highlightsDiv.append(hr);
            highlightsDiv.append(p);
            highlightsDiv.append(sub);
        }
    });
}