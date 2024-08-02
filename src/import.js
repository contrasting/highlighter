// https://developer.chrome.com/docs/capabilities/web-apis/file-system-access
async function importHighlights() {
    const fileHandles = await window.showOpenFilePicker();
    const text = await (await fileHandles[0].getFile()).text()
    const json = JSON.parse(text);
    await chrome.storage.local.set(json);
    console.log("Successfully imported");
}