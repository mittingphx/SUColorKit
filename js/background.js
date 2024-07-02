
chrome.runtime.onInstalled.addListener(() => {

    chrome.contextMenus.create({
        "id": "GSMColorPicker",
        "title": "✪ GSM Color Picker",
        "contexts": ["all"]
    })
});


chrome.contextMenus.onClicked.addListener((info, tab) => {
    let color = info.selectionText;
    console.log('TODO: open color picker: ' + color);
    //chrome.tabs.create({
    //  url: `https://www.google.com/search?q=${encodeURIComponent(info.selectionText)}`
    //})
});