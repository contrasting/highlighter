// https://developer.chrome.com/docs/extensions/reference/api/storage#synchronous_response_to_storage_updates
chrome.storage.local.onChanged.addListener((changes) => {
    const highlights = changes[window.location.href];

    // if is deletion, then refresh page
    if (highlights.oldValue != null && highlights.newValue.length < highlights.oldValue.length) {
        // reloading will automatically apply highlights
        document.location.reload();
    } else {
        applyHighlights(highlights.newValue, true);
    }

});

function applyHighlights(highlights, onlyFirst = false) {
    if (highlights === undefined) return;

    // store the current scroll position
    const pos = document.documentElement.scrollTop;

    // https://stackoverflow.com/questions/8276113/what-is-the-best-approach-to-search-some-text-in-body-html
    for (let h of highlights) {
        // wraparound otherwise will skip instances
        if (window.find(h, true, false, true)) {
            highlightCurrSelection();
        } else {
            highlightMultiPara(h);
        }
        if (onlyFirst) break;
    }

    // restore
    document.documentElement.scrollTop = pos;

    // clear the selection when done
    window.getSelection().empty();
}

function highlightCurrSelection() {
    let rng = window.getSelection().getRangeAt(0);

    // https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
    const mark = document.createElement("mark");
    mark.appendChild(rng.cloneContents());
    mark.ondblclick = () => {
        // delete
        chrome.storage.local.get(window.location.href).then(results => {
            const highlights = results[window.location.href];
            const filtered = highlights.filter(h => !h.includes(mark.innerText));
            chrome.storage.local.set({[window.location.href]: filtered}).then();
        });
    };
    rng.deleteContents();
    rng.insertNode(mark);
}

function highlightMultiPara(str) {
    const paragraphs = str.split("\n").filter(s => s !== "");

    for (let p of paragraphs) {
        if (window.find(p, true, false, true)) {
            highlightCurrSelection();
        }
    }
}

chrome.runtime.onMessage.addListener(async (message) => {
    if (message === "highlight") {
        const text = window.getSelection().toString();
        const url = window.location.href;

        // https://developer.chrome.com/docs/extensions/reference/api/storage#examples
        const highlights = (await chrome.storage.local.get(url))[url] ?? [];

        await chrome.storage.local.set({
            [url]: [text, ...highlights]
        })
    }
})

// initial load
chrome.storage.local.get(window.location.href).then(highlights => {
    // delay applying by 1 sec - let document finish loading
    setTimeout(() => applyHighlights(highlights[window.location.href]), 1500);
});