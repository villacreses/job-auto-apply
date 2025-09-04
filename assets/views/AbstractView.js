export class AbstractView extends HTMLElement {
  static _elementId = 'abstract-view'
  
  static get elementId () {
    return this._elementId;
  }

  constructor(buttonProps, scriptFilenames) {
    super();
    this._initialized = false; 
    this._buttonProps = buttonProps;
    this._scriptFilenames = scriptFilenames;

    this._init = this._init.bind(this);
    this.buildElement = this.buildElement.bind(this);
    // this.makeVisible = this.makeVisible.bind(this);
    // this.toggleVisibility = this.toggleVisibility.bind(this);
  }

  async _init() {
    const storageKey = `init_${this.constructor.elementId}`.replace('-', '_');
    
    this._buttonProps.forEach(this.buildElement);
    this.classList.add('btn-group');

    const saved = await chrome.storage.local.get([storageKey]);
    
    if (!saved[storageKey]) { 
      await Promise.all(
        this._scriptFilenames.map(AbstractView.injectScript)
      );
      
      chrome.storage.local.set({ [storageKey]: true });
    }

    this._initialized = true;
  }

  connectedCallback() {
    if (!this._initialized) this._init();
  }

  static async injectScript(filename) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    await chrome.scripting.executeScript({
      target: {tabId : tab.id},
      files: [`assets/injected/${filename}`],
      world: 'MAIN',
    });
  }
  
  async buildElement({ buttonText, action, className = '' }) {
    const button = document.createElement('button');
    
    button.innerText = buttonText;
    button.setAttribute('type', 'button');
    if (className) button.classList.add(className);
    
    button.addEventListener("click", async () => {
      console.log('Clicked')
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      chrome.scripting.executeScript({       
        target: { tabId: tab.id },
        func: (type) => {
          window.postMessage({ type }, '*');
        },
        args: [action],
        world: 'MAIN' // ensures it runs in the page's JS context
      });
    })

    this.appendChild(button);
  }
}
