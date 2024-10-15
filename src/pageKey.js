function getPageKey() {
    let urlObject = new URL(window.location.href);
    urlObject.hash = '';  // This removes the fragment part
    return urlObject.toString();
}