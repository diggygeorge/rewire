let blockedSites = [];
console.log("Blocked Sites (re)initialized")

function block(activeInfo, tab) {
  var url = new URL(tab.url)
  var domain = url.hostname
  console.log("Site:", domain)
  console.log("Blocked Sites:", blockedSites)
    if (blockedSites && blockedSites.includes(domain)) {
        chrome.tabs.sendMessage(activeInfo.tabId, { type: "BLOCK" }).catch((error) => {
        console.log("Error:", error);
      })
      }
      else {
        console.log("Tab is not in blocked list!")
      }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("Rewire extension installed!");
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log("Tab switch detected!")
  console.log(activeInfo.tabId)
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    block(activeInfo, tab)
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log("Tab update detected!");

  if (changeInfo.status === 'complete') {
    console.log("Tab status complete!");
    block({ tabId }, tab);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "UPDATE_BLOCKLIST") {
    blockedSites = message.data
  }
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    let currentTab = tabs[0];
    
    if (currentTab) {
      block({ tabId: currentTab.id }, currentTab);
    }
  });
})