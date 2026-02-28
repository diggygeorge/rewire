
var blocks = []
console.log("Blocked Sites (re)initialized")

var screenTimes = new Map()
var currentSite = "extensions/"
var currentTime = ""
var currentDay = -1

function updateTime() {
  let date = new Date()
  currentTime = date.toLocaleTimeString('en-US', {hour12: false})
  currentDay = currentDay !== date.getDay() ? date.getDay() : currentDay

  console.log(currentSite, currentTime, currentDay)
  screenTimes.set(currentSite, (screenTimes.get(currentSite) ?? 0) + 1);
  console.log(currentSite, screenTimes.get(currentSite))
}

setInterval(updateTime, 1000)

function isOverLimit(currentSite, time, day, blocks) {
    // currentSite: current hovered site
    // time: HH:MM:SS
    // day: given as a integer (0 for Sunday, 1 for Monday, etc.)
    // blocks: list of blocks, see src/timeblock.ts
    if (!blocks) {
      return false
    }
    const isOverLimitAnon = (block) => {
        if (block.website?.includes(currentSite)) {
            let block_interval = block.times[day]
            let arr = time.split(":")
            let hour = arr[0]
            let minute = arr[1]
            let minute_index = parseInt(hour) * 60 + parseInt(minute)
            let yesterday = block.times[(day + 6) % 7]

            if (block_interval.start == -1 && minute_index >= yesterday.end) {
                return false
            }
            if (block_interval.start > block_interval.end) {
                if (minute_index >= block_interval.start || minute_index < block_interval.end) {
                    return true
                } else {
                    return false;
                }
            } else {
                if (minute_index < yesterday.end) {
                    return true
                } else if (minute_index >= block_interval.start && minute_index < block_interval.end) {
                    return true
                }
            }
        }
    }
    return blocks.some(isOverLimitAnon); 
}

function block(activeInfo, tab) {
  var url = new URL(tab.url)
  var domain = url.hostname
  console.log("Site:", domain)
  console.log("Blocks:", blocks)
    if (isOverLimit(domain, currentTime, currentDay, blocks)) {
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
    blocks = message.data
  }
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    let currentTab = tabs[0];
    
    if (currentTab) {
      block({ tabId: currentTab.id }, currentTab);
    }
  });
})