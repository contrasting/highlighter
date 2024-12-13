function getPageKey(url) {
    let urlObject = new URL(url ?? window.location.href);
    urlObject.hash = '';  // This removes the fragment part
    return urlObject.toString();
}