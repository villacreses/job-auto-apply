import { AbstractButtonGroup } from "./AbstractExtButton.js";

class LinkedInButtons extends AbstractButtonGroup {
  constructor() {
    super([
      { buttonText: 'Test', action: 'test' },
    ]);
  }
}

export default {
  register: () => {
    customElements.define('linkedin-buttons', LinkedInButtons)
  }
}