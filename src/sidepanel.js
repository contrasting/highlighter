chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.active) {
        const pageKey = getPageKey(tab.url);
        document.querySelector("#activeUrl").innerHTML = pageKey;
        chrome.storage.local.get(pageKey).then(highlights => {
            const highlightsDiv = document.querySelector("#highlights");
            highlightsDiv.innerHTML = "";
            if (highlights[pageKey] == null || highlights[pageKey].length === 0) {
                highlightsDiv.innerHTML = "There are no highlights on this page."
            }
            for (const h of highlights[pageKey]) {
                const p = document.createElement("p");
                // render emojis
                p.innerHTML = h.text;
                highlightsDiv.append(p);
            }
        });
    }
});