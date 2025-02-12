function createTooltip(text) {
    const tooltip = document.createElement("span");
    tooltip.id = "highlighter-tooltip";
    tooltip.innerText = text;
    // https://www.w3schools.com/css/css_tooltip.asp
    tooltip.style.visibility = "visible";
    tooltip.style.maxWidth = "240px";
    tooltip.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    tooltip.style.backdropFilter = "blur(5px)";
    tooltip.style.color = "#fff";
    tooltip.style.padding = "6px 8px";
    tooltip.style.borderRadius = "6px";
    tooltip.style.position = "absolute";
    tooltip.style.zIndex = "1";
    tooltip.style.fontFamily = "sans-serif";
    tooltip.style.fontSize = "16px";
    tooltip.style.textAlign = "left";
    return tooltip;
}