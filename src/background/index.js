
var blocks = []
var errorThrown = false
var screenTimes = new Map()
var currentSite = "extensions"
var currentTime = ""
var currentDay = -1
var siteStartTime = new Date()

function keepAlive() {
  setInterval(() => {
    chrome.runtime.getPlatformInfo(function() {
      console.log('Keeping service worker alive.');
    });
  }, 20000);
}

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

function isOverBlockLimit(currentSite, time, day, blocks) {
    // currentSite: current hovered site
    // time: HH:MM:SS
    // day: given as a integer (0 for Sunday, 1 for Monday, etc.)
    // blocks: list of blocks, see src/timeblock.ts
    // limits: list of time limits, see src/limitblock.ts

    if (!blocks) {
      return false
    }
    for (let i = 0; i < blocks.length; i++) {
        let block = blocks[i]
        if (block.type == "INTERVAL" && block.website?.includes(currentSite)) {
            let block_interval = block.times[day]
            let arr = time.split(":")
            let hour = arr[0]
            let minute = arr[1]
            let minute_index = parseInt(hour) * 60 + parseInt(minute)
            let yesterday = block.times[(day + 6) % 7]
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
                    return timeRemaining(minute_index, day, block?.times)
                }
            }
        }
    }

    return false
    
}

function isOverTimeLimit(currentSite, limits, currentDay, screenTimes) {
  // currentSite: current hovered site
  // limits: list of time limits, see src/timeblock.ts
  //console.log(currentSite, limits, currentDay, screenTimes)
  if (!limits) {
    return false
  }
  let timeRemaining = 1000000 // placeholder max value
  for (let i = 0; i < limits.length; i++) {
    let limit = limits[i]
    if (limit.type == "LIMIT" && limit.website?.includes(currentSite)) {
      if (screenTimes.get(currentSite) >= limit.times[currentDay]) {
        return true
      } else if (limit.times[currentDay] == 0) {
        return true
      } else if (!screenTimes.has(currentSite)) {
        return false
      } else {
        // screenTimes.get(currentSite) < limit.times[currentDay]
        timeRemaining = Math.min(timeRemaining, limit.times[currentDay] - screenTimes.get(currentSite))
      }
    }
  }
  if (timeRemaining == 1000000) {
    return false
  } else {
    return timeRemaining / 60
  }
}

async function block(activeInfo, tab) {
  if (!tab.url.startsWith('http')) return;
  let date = new Date()
  currentTime = date.toLocaleTimeString('en-US', {hour12: false})
  if (currentDay !== date.getDay()) {
    // new day, reset the map
    screenTimes.clear()
    currentDay = date.getDay()
  }
  var url = new URL(tab.url)
  
  var domain = url.hostname
  //console.log("Site:", domain)
  //console.log("Blocks:", blocks)
  let intervalLimit = isOverBlockLimit(domain, currentTime, currentDay, blocks)
  let timeLimit = isOverTimeLimit(domain, blocks, currentDay, screenTimes)
  //console.log(intervalLimit, timeLimit)

    if (intervalLimit == true || timeLimit == true) {
        //console.log("Sending blocking message from background...")
        chrome.tabs.sendMessage(activeInfo.tabId, { type: "BLOCK" }).catch((error) => {
            //console.log("Regular Block", error);
          });
      }
      let limit = false; 

      const hasInterval = typeof intervalLimit === 'number';
      const hasTime = typeof timeLimit === 'number';

      if (hasInterval && hasTime) {
        limit = Math.min(intervalLimit, timeLimit);
      } else if (hasInterval) {
        limit = intervalLimit;
      } else if (hasTime) {
        limit = timeLimit;
      }
        if (limit != false) {
          //console.log("Restriction will occur in", limit, "minutes!")
          const alarm = await chrome.alarms.get(`${domain}-restriction`);

          if (!alarm) {
            await chrome.alarms.create(`${domain}-restriction`, { periodInMinutes: Math.max(limit, 0.5) });
          }
        }
        //console.log("Current site not blocked!")
      }
    

chrome.runtime.onInstalled.addListener(() => {
  //console.log("Rewire extension installed!");
  keepAlive(); // starts keepalive logic for service worker
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log("Tab switch detected!")
  keepAlive();
  let newSiteStartTime = Date.now()
  let difference = newSiteStartTime - siteStartTime

  // add difference to chart
  screenTimes.set(currentSite, (screenTimes.get(currentSite) ?? 0) + difference / 1000)
  siteStartTime = newSiteStartTime
  //console.log("Added a total of", difference / 1000, "seconds to the list!")
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
    const alarm = chrome.alarms.get(`${domain}-restriction`);

    if (alarm) {
      chrome.alarms.clear(`${domain}-restriction`);
    }
    block(activeInfo, tab)
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  keepAlive();
  //console.log("Tab update detected!");
  let url = new URL(tab.url)
  let domain = url.hostname
  currentSite = domain
  //console.log("Status:", changeInfo.status)
  if (changeInfo.status === 'complete' || !changeInfo.status) {
    block({ tabId }, tab);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "UPDATE_BLOCKLIST") {
    //console.log("Updating blocklist...")
    blocks = message.data
  }
  if (message.type === "GET_CURRENT_STATUS") {
    //console.log("Asking for current status...")
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

chrome.alarms.onAlarm.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    let currentTab = tabs[0];
    
    if (currentTab) {
    //console.log("ALARM SET OFF!");
        chrome.tabs.sendMessage(currentTab.id, { type: "BLOCK" })
          .then((response) => {
            errorThrown = false; 
          })
          .catch((error) => {
            errorThrown = true;
            //console.log("Alarm Block", error);
          });
        }
      })
    })