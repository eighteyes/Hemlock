
function incCounter(){
  chrome.browserAction.getBadgeText(function(count){
    var c = Number.parseInt(count) + 1;
    chrome.browserAction.setBadgeText({text: c.toString() })
  })
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    chrome.browserAction.setBadgeText({text: request.count.toString() });
    sendResponse({farewell: "goodbye"});
  });

chrome.browserAction.onClicked.addListener(function callback(tab){
  log('clicked ext button')
     runBaseFilter(populateList())
     chrome.browserAction.setPopup({popup:'panel.html'})
  })
