import { LINKEDIN_NEXT_LISTING } from "../constants.js";
import { AbstractButtonGroup } from "./AbstractExtButton.js";

class LinkedInButtons extends AbstractButtonGroup {
  constructor() {
    super([
      { buttonText: 'Test', action: LINKEDIN_NEXT_LISTING },
    ]);
  }
}

export default {
  register: () => {
    customElements.define('linkedin-buttons', LinkedInButtons)
  }
}