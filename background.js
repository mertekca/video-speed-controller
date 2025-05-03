chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "setSpeed") {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: (speed) => {
          document.querySelectorAll('video').forEach(v => v.playbackRate = speed);
        },
        args: [request.speed]
      });
    });
  }
});
