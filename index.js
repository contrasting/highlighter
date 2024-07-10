// https://developer.chrome.com/docs/extensions/reference/api/storage#synchronous_response_to_storage_updates
chrome.storage.local.onChanged.addListener((changes, namespace) => {
    const highlights = changes[window.location.href].newValue;
    applyHighlights(highlights);
});

function applyHighlights(highlights) {
    // https://stackoverflow.com/questions/8276113/what-is-the-best-approach-to-search-some-text-in-body-html
    // https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
    for (let h of highlights) {
        window.find(h);
        let rng = window.getSelection().getRangeAt(0);

        const mark = document.createElement("mark");
        mark.appendChild(rng.cloneContents());

        rng.deleteContents();
        rng.insertNode(mark);
    }

    // clear the selection when done
    window.getSelection().removeAllRanges();
}

// initial load
chrome.storage.local.get(window.location.href).then(highlights => {
    applyHighlights(highlights[window.location.href]);
});