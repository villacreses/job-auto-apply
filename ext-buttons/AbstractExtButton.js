// AbstractExtButton.js
export class AbstractButtonGroup extends HTMLElement {
  constructor(buttonProps) {
    super();
    this._initialized = false; 
    this._buttonProps = buttonProps;
  }

  connectedCallback() {
    if (!this._initialized) {
      this.init(this._buttonProps);
    }
  }

  init(config) {
    this.classList.add('btn-group');
    
    config.forEach(({ buttonText, action }) =>
      this.buildElement(buttonText, action)
    );

    this._initialized = true;
  }

  // AbstractExtButton.js

buildElement(buttonText, action) {
  const button = document.createElement('button');
  
  button.innerText = buttonText;
  button.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Use a callback to handle potential errors
    chrome.tabs.sendMessage(tab.id, { action }, (response) => {
      // Check for an error in the last operation
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError.message);
      } else {
        // Handle a successful response, if any
        console.log("Message sent successfully.");
      }
    });
  });
  
  this.appendChild(button);
}
}
