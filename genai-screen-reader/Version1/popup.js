// popup.js – simple ping to confirm extension is active
const statusEl = document.getElementById("status");
const pingBtn = document.getElementById("pingBtn");

pingBtn.addEventListener("click", async () => {
  statusEl.textContent = "Pinging content script...";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        console.log("[AI Smart Reader] Popup ping received on this page.");
        alert("AI Smart Reader Modular NLP + AI: content script is active on this page!");
      }
    });

    statusEl.textContent = "Ping sent. Check the page + console.";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Error pinging content script (see console).";
  }
});
