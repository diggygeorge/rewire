chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "BLOCK") {

    if (document.getElementById('rewire-screen')) return;
    Object.assign(document.body.style, {overflow: "hidden"})
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
});