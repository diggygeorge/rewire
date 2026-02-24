var blockedSites = []
console.log("Blocked Sites (re)initialized")

var screenTimes = new Map()
var currentSite = "extensions/"

function updateTime() {
  const currentTime = new Date().toLocaleTimeString();
  console.log(currentSite, currentTime)
  screenTimes.set(currentSite, (screenTimes.get(currentSite) ?? 0) + 1);
  console.log(currentSite, screenTimes.get(currentSite))
}

setInterval(updateTime, 1000)

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
  chrome.tabs.get(activeInfo.tabId, function(tab) {
    let url = new URL(tab.url)
    let domain = url.hostname
    currentSite = domain
  })
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    block(activeInfo, tab)
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log("Tab update detected!");
  let url = new URL(tab.url)
  let domain = url.hostname
  currentSite = domain

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