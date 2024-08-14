function applyHighlights(highlights) {
    if (highlights === undefined) return;

    // store the current scroll position
    const pos = document.documentElement.scrollTop;

    for (let h of highlights) {
        const tooltip = h.note != null ? createTooltip(h.note) : null;
        const paragraphs = h.text.split("\n").filter(s => s !== "");

        for (let p of paragraphs) {
            // https://stackoverflow.com/questions/8276113/what-is-the-best-approach-to-search-some-text-in-body-html
            // wraparound otherwise will skip instances
            if (window.find(p, true, false, true)) {
                highlightCurrSelection(h.id, h.type, tooltip);
            }
        }
    }

    // restore
    document.documentElement.scrollTop = pos;

    // clear the selection when done
    window.getSelection().empty();
}

function highlightCurrSelection(id, type, tooltip) {
    let rng = window.getSelection().getRangeAt(0);
    // https://developer.mozilla.org/en-US/docs/Web/API/Range/commonAncestorContainer
    let parent = rng.commonAncestorContainer;
    while (parent.nodeType === Node.TEXT_NODE) parent = parent.parentNode;
    addToChangedNodes({node: parent, old: parent.innerHTML});

    // https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
    const mark = document.createElement(type ?? "mark");
    mark.style.cursor = "crosshair";
    // make focusable https://stackoverflow.com/questions/16261504/make-div-element-receive-focus
    mark.tabIndex = 0;
    mark.onfocus = () => mark.style.outline = "solid 2px deepskyblue";
    mark.onblur = () => mark.style.outline = "none";
    mark.appendChild(rng.cloneContents());
    // only fires when focused
    mark.onkeydown = (ev) => {
        if (ev.key === "Delete") {
            // delete
            chrome.storage.local.get(window.location.href).then(async results => {
                const highlights = results[window.location.href];
                const filtered = highlights.filter(h => h.id !== id);
                return chrome.storage.local.set({[window.location.href]: filtered});
            });
        }
    };
    mark.ondblclick = () => {
        const note = window.prompt("Enter note:", tooltip?.innerText);
        if (note != null) {
            // create or update note
            chrome.storage.local.get(window.location.href).then(async results => {
                const highlights = results[window.location.href];
                const thisHighlight = highlights.find(h => h.id === id);
                thisHighlight.note = note !== "" ? note : undefined;
                const filtered = highlights.filter(h => h.id !== id);
                return chrome.storage.local.set({[window.location.href]: [thisHighlight, ...filtered]});
            });
        }
    }
    if (tooltip != null) {
        mark.style.borderBottom = "2px dotted grey";
        mark.onmouseenter = () => tooltip.style.visibility = "visible";
        mark.onmouseleave = () => tooltip.style.visibility = "hidden";
        mark.appendChild(tooltip);
    }
    rng.deleteContents();
    rng.insertNode(mark);
}

chrome.runtime.onMessage.addListener(async (message) => {
    if (message === "import") {
        return importHighlights();
    }
    if (message === "reload") {
        return chrome.storage.local.get(window.location.href).then(highlights => {
            reset();
            applyHighlights(highlights[window.location.href]);
        });
    }

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
        time: Date.now(),
    };

    return chrome.storage.local.set({[url]: [newHighlight, ...highlights]});
})

const changedNodes = [];

function addToChangedNodes(node) {
    // don't add if already added - it may have been modified
    for (const n of changedNodes) {
        if (n.node === node.node) return;
    }
    changedNodes.push(node);
}

function reset() {
    changedNodes.forEach(n => n.node.innerHTML = n.old);
    changedNodes.length = 0;
}

// https://developer.chrome.com/docs/extensions/reference/api/storage#synchronous_response_to_storage_updates
chrome.storage.local.onChanged.addListener((changes) => {
    reset();
    applyHighlights(changes[window.location.href].newValue);
});

// initial load
chrome.storage.local.get(window.location.href).then(highlights => {
    // delay applying by 1 sec - let document finish loading
    setTimeout(() => applyHighlights(highlights[window.location.href]), 1500);
});