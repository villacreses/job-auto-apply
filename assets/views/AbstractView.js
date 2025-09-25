export class AbstractView extends HTMLElement {
  static _elementId = 'abstract-view'
  
  static get elementId () {
    return this._elementId;
  }

  static register() {
    console.log(this._elementId, this)
    customElements.define(this._elementId, this);
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

    const saved = await chrome.storage.session.get([storageKey]);
    
    if (!saved[storageKey]) { 
      await Promise.all(
        this._scriptFilenames.map(AbstractView.injectScript)
      );
      
      chrome.storage.session.set({ [storageKey]: true });
    }

    this._initialized = true;
  }

  connectedCallback() {
    if (!this._initialized) this._init();
  }

  static async injectScript(filename) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
      if (!tab || !tab.id) {
        console.error("No active tab found.");
        return;
      }
  
      // Ensure tab is fully loaded
      if (tab.status !== "complete") {
        await new Promise((resolve) => {
          const listener = (tabId, info) => {
            if (tabId === tab.id && info.status === "complete") {
              chrome.tabs.onUpdated.removeListener(listener);
              resolve();
            }
          };
          chrome.tabs.onUpdated.addListener(listener);
        });
      }
      
      await chrome.scripting.executeScript({
        target: {tabId : tab.id},
        files: [`assets/injected/${filename}`],
        world: 'MAIN',
      })
      
      console.log(`Injected script: ${filename}`);
    } catch (err) {
      console.error(`Failed to inject ${filename}:`, err);
    }
  }
  
  async buildElement({ buttonText, action, className = '' }) {
    const button = document.createElement('button');
    
    button.innerText = buttonText;
    button.setAttribute('type', 'button');
    if (className) button.classList.add(className);
    
    button.addEventListener("click", async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      chrome.scripting.executeScript({       
        target: { tabId: tab.id },
        func: (type) => {
          window.postMessage({ type, ext_source: 'EXT' }, '*');
        },
        args: [action],
        world: 'MAIN' // ensures it runs in the page's JS context
      });
    })

    this.appendChild(button);
  }
}
