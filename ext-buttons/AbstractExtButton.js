export class AbstractButtonGroup extends HTMLElement {  
  static elementId = 'abstract-btn-group';

  constructor(buttonProps) {
    super();
    this._initialized = false; 
    this._buttonProps = buttonProps;

    this._init = this._init.bind(this);
    this.buildElement = this.buildElement.bind(this);
  }

  connectedCallback() {
    if (!this._initialized) {
      this._init(this._buttonProps);
    }
  }

  _init(config) {
    this.classList.add('btn-group');
    
    config.forEach(this.buildElement);

    this._initialized = true;
  }

  buildElement({ buttonText, action, className = '' }) {
    const button = document.createElement('button');
    
    button.innerText = buttonText;
    if (className) button.classList.add(className);

    button.addEventListener("click", async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const message = { action };

      // Use a callback to handle potential errors
      chrome.tabs.sendMessage(tab.id, message, (response) => {
        // Check for an error in the last operation
        if (chrome.runtime.lastError) {
          console.error("Error sending message:", chrome.runtime.lastError.message);
        } else {
          // Handle a successful response, if any
          console.log("Message sent successfully:", message);
        }
      });
    });
    
    this.appendChild(button);
  }

  static handleMessage(message) {}
}
