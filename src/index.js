function applyHighlights(highlights) {
    if (highlights === undefined) return;

    // store the current scroll position
    const pos = document.documentElement.scrollTop;

    // https://stackoverflow.com/questions/8276113/what-is-the-best-approach-to-search-some-text-in-body-html
    for (let h of highlights) {
        // wraparound otherwise will skip instances
        if (window.find(h.text, true, false, true)) {
            highlightCurrSelection(h.id, h.type, h.note);
        } else {
            highlightMultiPara(h);
        }
    }

    // restore
    document.documentElement.scrollTop = pos;

    // clear the selection when done
    window.getSelection().empty();
}

function highlightCurrSelection(id, type, note) {
    let rng = window.getSelection().getRangeAt(0);

    // https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
    const mark = document.createElement(type ?? "mark");
    mark.style.cursor = "crosshair";
    // make focusable https://stackoverflow.com/questions/16261504/make-div-element-receive-focus
    mark.tabIndex = 0;
    mark.onfocus = () => mark.style.outlineStyle = "solid";
    mark.onblur = () => mark.style.outlineStyle = "none";
    mark.appendChild(rng.cloneContents());
    // only fires when focused
    mark.onkeydown = (ev) => {
        if (ev.key !== "Delete") return;
        // delete
        chrome.storage.local.get(window.location.href).then(async results => {
            const highlights = results[window.location.href];
            const filtered = highlights.filter(h => h.id !== id);
            await chrome.storage.local.set({[window.location.href]: filtered});
            // reloading will automatically apply highlights
            window.location.reload();
        });
    };
    if (note != null) {
        const tooltip = createTooltip(note);
        mark.style.borderBottom = "1px dotted black";
        mark.onmouseenter = () => tooltip.style.visibility = "visible";
        mark.onmouseleave = () => tooltip.style.visibility = "hidden";
        mark.appendChild(tooltip);
    }
    rng.deleteContents();
    rng.insertNode(mark);
}

function highlightMultiPara(highlight) {
    const paragraphs = highlight.text.split("\n").filter(s => s !== "");

    for (let p of paragraphs) {
        if (window.find(p, true, false, true)) {
            highlightCurrSelection(highlight.id, highlight.type, highlight.note);
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
        case "annotate":
        default:
            elementType = "mark";
    }

    const newHighlight = {
        text: text,
        id: uuidv4(),
        type: elementType,
        ... (message === "annotate" && {note: window.prompt("Enter note:")})
    };

    await chrome.storage.local.set({[url]: [newHighlight, ...highlights]});

    applyHighlights([newHighlight]);
})

function createTooltip(text) {
    const tooltip = document.createElement("span");
    tooltip.innerText = text;
    // https://www.w3schools.com/css/css_tooltip.asp
    tooltip.style.visibility = "hidden";
    tooltip.style.maxWidth = "240px";
    tooltip.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    tooltip.style.backdropFilter = "blur(5px)";
    tooltip.style.color = "#fff";
    tooltip.style.padding = "6px 8px";
    tooltip.style.borderRadius = "6px";
    tooltip.style.position = "absolute";
    tooltip.style.zIndex = "1";
    tooltip.style.fontFamily = "sans-serif";
    return tooltip;
}

// initial load
chrome.storage.local.get(window.location.href).then(highlights => {
    // delay applying by 1 sec - let document finish loading
    setTimeout(() => applyHighlights(highlights[window.location.href]), 1500);
});