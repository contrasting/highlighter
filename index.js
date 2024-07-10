// https://developer.chrome.com/docs/extensions/reference/api/storage#synchronous_response_to_storage_updates
chrome.storage.local.onChanged.addListener((changes) => {
    const highlights = changes[window.location.href].newValue;
    applyHighlights(highlights);
});

function applyHighlights(highlights) {
    if (highlights === undefined) return;

    // store the current scroll position
    const pos = document.documentElement.scrollTop;

    // https://stackoverflow.com/questions/8276113/what-is-the-best-approach-to-search-some-text-in-body-html
    // https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
    for (let h of highlights) {
        // wraparound otherwise will skip instances
        window.find(h, true, false, true);
        let rng = window.getSelection().getRangeAt(0);

        const mark = document.createElement("mark");
        mark.appendChild(rng.cloneContents());

        rng.deleteContents();
        rng.insertNode(mark);
    }

    // restore
    document.documentElement.scrollTop = pos;

    // clear the selection when done
    window.getSelection().empty();
}

// initial load
chrome.storage.local.get(window.location.href).then(highlights => {
    // delay applying by 1 sec - let document finish loading
    setTimeout(() => applyHighlights(highlights[window.location.href]), 1000);
});