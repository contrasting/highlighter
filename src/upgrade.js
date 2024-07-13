(function upgradeHighlightData() {
    chrome.storage.local.get(null, function (items) {
        for (const url of Object.keys(items)) {
            const pageHighlights = items[url];
            const newHighlights = [];
            for (const highlight of pageHighlights) {
                if (typeof (highlight) !== "string") {
                    return;
                }
                newHighlights.push({
                    text: highlight,
                    id: uuidv4(),
                })
            }
            chrome.storage.local.set({
                [url]: newHighlights
            }).then()
        }
    });
})()