import LinkedInButton from './ext-buttons/linkedin.js';

const messageHandlers = {
  CONTENT_LINKEDIN: LinkedInButton.handleMessage,
};

function onDOMLoaded() {
  LinkedInButton.register();

  chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
      if (message.target !== 'EXT_DOM') return;
      
      const handler = messageHandlers[message.source];
      console.log('Message received:', message);
      
      if (!handler) {
        const msg = `Handler not found for '${message.source}'`;
        console.error(msg);
        sendResponse({ status: 404, msg });
        return;
      }
      
      sendResponse({ status: 200 });
      handler(message.content);
    }
  );
}

document.addEventListener('DOMContentLoaded', onDOMLoaded);
