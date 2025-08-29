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

  buildElement(buttonText, action) {
    const button = document.createElement('button');
    
    button.innerText = buttonText;
    button.addEventListener("click", async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.sendMessage(tab.id, { action });
    });
    
    this.appendChild(button);
  }
}

export function createAndRegisterButton(elementName, buttonProps) {
  console.log('elementName', elementName)
  customElements.define(elementName, buildButtonClass(buttonProps));
}
