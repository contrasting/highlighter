// https://developer.chrome.com/docs/extensions/reference/api/storage#synchronous_response_to_storage_updates
chrome.storage.local.onChanged.addListener((changes) => {
    const highlights = changes[window.location.href].newValue;
    applyHighlights(highlights);
});


const resets = [];

function resetHighlights() {
    resets.forEach(r => r());
    resets.length = 0;
}

function applyHighlights(highlights) {
    if (highlights === undefined) return;

    resetHighlights();

    // store the current scroll position
    const pos = document.documentElement.scrollTop;

    // https://stackoverflow.com/questions/8276113/what-is-the-best-approach-to-search-some-text-in-body-html
    // https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
    for (let h of highlights) {
        // wraparound otherwise will skip instances
        if (window.find(h, true, false, true)) {
            resets.push(highlightCurrSelection());
        } else {
            recursiveHighlight(h);
        }
    }

    // restore
    document.documentElement.scrollTop = pos;

    // clear the selection when done
    window.getSelection().empty();
}

function highlightCurrSelection() {
    let rng = window.getSelection().getRangeAt(0);

    const mark = document.createElement("mark");
    mark.appendChild(rng.cloneContents());
    mark.ondblclick = () => {
        // delete
        chrome.storage.local.get(window.location.href).then(results => {
            const highlights = results[window.location.href];
            const filtered = highlights.filter(h => !h.includes(mark.innerText));
            chrome.storage.local.set({[window.location.href]: filtered}).then(() => {
            });
        });
    };

    rng.deleteContents();
    rng.insertNode(mark);
    return () => {
        rng.deleteContents();
        rng.insertNode(document.createTextNode(mark.innerText));
    };
}

function recursiveHighlight(str) {
    const words = str.split(" ").filter(s => s !== "");

    for (let i = words.length; i >= 0; i--) {
        const reducedStr = words.filter((value, index) => index < i).join(" ");
        if (window.find(reducedStr, true, false, true)) {
            resets.push(highlightCurrSelection());
            // the rest of the string
            recursiveHighlight(words.filter((value, index) => index >= i).join(" "));
            break;
        }
    }
}

// initial load
chrome.storage.local.get(window.location.href).then(highlights => {
    // delay applying by 1 sec - let document finish loading
    setTimeout(() => applyHighlights(highlights[window.location.href]), 1000);
});