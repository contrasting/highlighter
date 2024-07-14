function applyHighlights(highlights) {
    if (highlights === undefined) return;

    // store the current scroll position
    const pos = document.documentElement.scrollTop;

    // https://stackoverflow.com/questions/8276113/what-is-the-best-approach-to-search-some-text-in-body-html
    for (let h of highlights) {
        // wraparound otherwise will skip instances
        if (window.find(h.text, true, false, true)) {
            highlightCurrSelection(h.id, h.type);
        } else {
            highlightMultiPara(h);
        }
    }

    // restore
    document.documentElement.scrollTop = pos;

    // clear the selection when done
    window.getSelection().empty();
}

function highlightCurrSelection(id, type) {
    let rng = window.getSelection().getRangeAt(0);

    // https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
    const mark = document.createElement(type ?? "mark");
    mark.appendChild(rng.cloneContents());
    mark.ondblclick = () => {
        // delete
        chrome.storage.local.get(window.location.href).then(async results => {
            const highlights = results[window.location.href];
            const filtered = highlights.filter(h => h.id !== id);
            await chrome.storage.local.set({[window.location.href]: filtered});
            // reloading will automatically apply highlights
            window.location.reload();
        });
    };
    rng.deleteContents();
    rng.insertNode(mark);
}

function highlightMultiPara(highlight) {
    const paragraphs = highlight.text.split("\n").filter(s => s !== "");

    for (let p of paragraphs) {
        if (window.find(p, true, false, true)) {
            highlightCurrSelection(highlight.id, highlight.type);
        }
    }
}

chrome.runtime.onMessage.addListener(async (message) => {
    const text = window.getSelection().toString();
    const url = window.location.href;

    // https://developer.chrome.com/docs/extensions/reference/api/storage#examples
    const highlights = (await chrome.storage.local.get(url))[url] ?? [];

    let elementType;
    switch (message) {
        case "strikethrough":
            elementType = "s";
            break;
        case "highlight":
        default:
            elementType = "mark";
    }

    const newHighlight = {
        text: text,
        id: uuidv4(),
        type: elementType,
    };

    await chrome.storage.local.set({[url]: [newHighlight, ...highlights]});

    applyHighlights([newHighlight]);
})

// initial load
chrome.storage.local.get(window.location.href).then(highlights => {
    // delay applying by 1 sec - let document finish loading
    setTimeout(() => applyHighlights(highlights[window.location.href]), 1500);
});