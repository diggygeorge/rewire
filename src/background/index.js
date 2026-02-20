let blockedSites = [];
console.log("Blocked Sites (re)initialized")

function block(activeInfo, tab) {
  var url = new URL(tab.url)
  var domain = url.hostname
  console.log("Site:", domain)
      console.log("Blocked Sites:", blockedSites)
      if (blockedSites.includes(domain)) {
        chrome.scripting.executeScript({
          target: { tabId: activeInfo.tabId },
          func: () => {
            document.body.innerHTML = "";
            const overlay = document.createElement("div");
            Object.assign(overlay.style, {
              position: "fixed",
              top: "0",
              left: "0",
              width: "100vw",
              height: "100vh",
              background: "#0f0f0f",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "white",
              fontSize: "2rem",
              fontFamily: "sans-serif",
              zIndex: "999999",
            });
            overlay.textContent = "🚫 Blocked by Rewire 🚫";
            document.body.appendChild(overlay);
          }
        })
      }
      else {
        console.log("Tab is not in blocked list!")
      }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("Rewire extension installed!");
  // run blocking logic
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
  console.log(tabId);

  if (changeInfo.status === 'complete') {
    console.log("Tab status complete!");
    block({ tabId }, tab);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "UPDATE_BLOCKLIST") {
    blockedSites = message.data
  }
})