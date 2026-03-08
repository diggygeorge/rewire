
var blocks = []
var errorThrown = false
var screenTimes = new Map()
var currentSite = "extensions"
var currentTime = ""
var currentDay = -1
var siteStartTime = new Date()

function timeRemaining(time, day, times) {
    // time: hour and minute parsed into minute index (Ex: 12PM -> 720)
    // day: given as a integer (0 for Sunday, 1 for Monday, etc.)
    // times: block.times

    let acc = 0;
    if (time < times[day].start) {
        acc += times[day].start - time
    } else {
        acc += 1440 - time

        let i = (day + 1) % 7;

        while (i != day && times[i].start == -1) {
            acc += 1440;
            i = (i + 1) % 7;
        }

        acc += times[i].start
    }
    return acc
}

function isOverLimit(currentSite, time, day, blocks) {
    // currentSite: current hovered site
    // time: HH:MM:SS
    // day: given as a integer (0 for Sunday, 1 for Monday, etc.)
    // blocks: list of blocks, see src/timeblock.ts
    if (!blocks) {
      return false
    }
    for (let i = 0; i < blocks.length; i++) {
        let block = blocks[i]
        if (block.website?.includes(currentSite)) {
            let block_interval = block.times[day]
            let arr = time.split(":")
            let hour = arr[0]
            let minute = arr[1]
            let minute_index = parseInt(hour) * 60 + parseInt(minute)
            let yesterday = block.times[(day + 6) % 7]
            console.log(minute_index, day, block?.times)
            if (block_interval.start == -1 && minute_index >= yesterday.end) {
                return timeRemaining(minute_index, day, block?.times)
            }
            if (block_interval.start > block_interval.end) {
                if (minute_index >= block_interval.start || minute_index < block_interval.end) {
                    return true
                } else {
                    return timeRemaining(minute_index, day, block?.times)
                }
            } else {
                if (minute_index < yesterday.end) {
                    return true
                } else if (minute_index >= block_interval.start && minute_index < block_interval.end) {
                    return true
                } else {
                    console.log(minute_index, day, block?.times, timeRemaining(minute_index, day, block?.times))
                    return timeRemaining(minute_index, day, block?.times)
                }
            }
        }
    }

    return false
    
}

async function block(activeInfo, tab) {
  let date = new Date()
  currentDay = currentDay !== date.getDay() ? date.getDay() : currentDay

  var url = new URL(tab.url)
  var domain = url.hostname
  console.log("Site:", domain)
  console.log("Blocks:", blocks)
  let limit = isOverLimit(domain, currentTime, currentDay, blocks)
    if (limit == true) {
        try {
          chrome.tabs.sendMessage(activeInfo.tabId, { type: "BLOCK" })
          .then((response) => {
            errorThrown = false;
          })
        } catch (error) {
          errorThrown = true
          console.log(error);
        }
      }
      else if (limit != false) {
        console.log("Restriction will occur in", limit, "minutes!")
        const alarm = await chrome.alarms.get(`${domain}-restriction`);

        if (!alarm) {
          await chrome.alarms.create(`${domain}-restriction`, { periodInMinutes: limit });
        }
      } else {
        console.log("Current site not blocked!")
      }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("Rewire extension installed!");
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log("Tab switch detected!")
  let newSiteStartTime = Date.now()
  let difference = newSiteStartTime - siteStartTime

  // add difference to chart
  screenTimes.set(currentSite, (screenTimes.get(currentSite) ?? 0) + difference / 1000)
  siteStartTime = newSiteStartTime
  console.log("Added a total of", difference / 1000, "seconds to the list!")
  const serializbleTime = Array.from(screenTimes.entries())

  chrome.storage.local.set({ time: serializbleTime }, () => {
      console.log("Screen Time Updated!");
      
      chrome.storage.local.get(["time"], (result) => {
        console.log("Screen Time:", result.time);
      });
    });

  chrome.tabs.get(activeInfo.tabId, function(tab) {
    let url = new URL(tab.url)
    let domain = url.hostname
    currentSite = domain
    // DID YOU IMPLEMENT THE ALARM LOGIC?

    block(activeInfo, tab)
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log("Tab update detected!");
  let url = new URL(tab.url)
  let domain = url.hostname
  currentSite = domain
  console.log("Status:", changeInfo.status)
  if (changeInfo.status === 'complete' || !changeInfo.status) {
    block({ tabId }, tab);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "UPDATE_BLOCKLIST") {
    blocks = message.data
  }
  if (message.type === "GET_CURRENT_STATUS") {
    sendResponse({site: currentSite, startTime: siteStartTime})
  }
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    let currentTab = tabs[0];
    
    if (currentTab) {
      block({ tabId: currentTab.id }, currentTab);
    }
  });
  return true
})