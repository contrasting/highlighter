// https://developer.chrome.com/docs/extensions/reference/api/storage#synchronous_response_to_storage_updates
chrome.storage.local.onChanged.addListener((changes, namespace) => {
    const highlights = changes[window.location.href].newValue;

    console.log(highlights);
});