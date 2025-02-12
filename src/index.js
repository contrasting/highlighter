function applyHighlights(highlights) {
    if (highlights === undefined) return;

    // store the current scroll position
    const pos = document.documentElement.scrollTop;

    for (let h of highlights) {
        const paragraphs = h.text.split("\n").filter(s => s !== "");

        for (let p of paragraphs) {
            // https://stackoverflow.com/questions/8276113/what-is-the-best-approach-to-search-some-text-in-body-html
            // wraparound otherwise will skip instances
            if (window.find(p, true, false, true)) {
                highlightCurrSelection(h.id, h.type, h.note);
            }
        }
    }

    // restore
    document.documentElement.scrollTop = pos;

    // clear the selection when done
    window.getSelection().empty();
}

function highlightCurrSelection(id, type, note) {
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
            chrome.storage.local.get(getPageKey()).then(async results => {
                const highlights = results[getPageKey()];
                const filtered = highlights.filter(h => h.id !== id);
                return chrome.storage.local.set({[getPageKey()]: filtered});
            });
        }
    };
    mark.ondblclick = () => {
        const newNote = window.prompt("Enter note:", note);
        if (newNote != null) {
            // create or update note
            chrome.storage.local.get(getPageKey()).then(async results => {
                const highlights = results[getPageKey()];
                const thisHighlight = highlights.find(h => h.id === id);
                thisHighlight.note = newNote !== "" ? newNote : undefined;
                const filtered = highlights.filter(h => h.id !== id);
                return chrome.storage.local.set({[getPageKey()]: [thisHighlight, ...filtered]});
            });
        }
    }
    if (note != null) {
        mark.style.borderBottom = "2px dotted grey";
        mark.onmouseenter = () => {
            document.body.appendChild(tooltip);
            tooltip.innerText = note;
        };
        mark.onmouseleave = () => {
            document.body.removeChild(tooltip);
        };
    }
    rng.deleteContents();
    rng.insertNode(mark);
}

chrome.runtime.onMessage.addListener(async (message) => {
    if (message === "import") {
        return importHighlights();
    }
    if (message === "reload") {
        return reloadHighlights();
    }

    const text = window.getSelection().toString();
    const url = getPageKey();

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

async function reloadHighlights() {
    return chrome.storage.local.get(getPageKey()).then(highlights => {
        reset();
        applyHighlights(highlights[getPageKey()]);
    });
}

// https://developer.chrome.com/docs/extensions/reference/api/storage#synchronous_response_to_storage_updates
chrome.storage.local.onChanged.addListener((changes) => {
    reset();
    applyHighlights(changes[getPageKey()].newValue);
});

// initial load
chrome.storage.local.get(getPageKey()).then(highlights => {
    // delay applying by 1 sec - let document finish loading
    setTimeout(() => applyHighlights(highlights[getPageKey()]), 1500);
});

window.addEventListener("focus", reloadHighlights);

// create global tooltip element
const tooltip = createTooltip("");
document.addEventListener("mousemove", (event) => {
    // https://stackoverflow.com/a/62347962/10176917
    tooltip.style.left = event.pageX + 'px';
    tooltip.style.top = event.pageY + 'px';
});