

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    chrome.browserAction.setBadgeText({text: request.count.toString() });
    sendResponse({farewell: "goodbye"});
  });