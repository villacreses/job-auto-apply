import { LINKEDIN_NEXT_LISTING } from "../constants.js";
import { AbstractButtonGroup } from "./AbstractExtButton.js";

const buttonText = {
  INACTIVE: 'Next Listing',
  PAUSED: 'Continue',
  ACTIVE: 'Running'
}


class LinkedInButtons extends AbstractButtonGroup {
  static elementId = 'linkedin-buttons';

  constructor() {
    super([
      {
        buttonText: 'Next Listing',
        action: LINKEDIN_NEXT_LISTING,
        className: 'primary'
      },
    ]);
  }

  static handleMessage(message) {
    const buttonGroup = document.querySelector(LinkedInButtons.elementId);
    const mainButton = buttonGroup.querySelector('.primary');
    
    mainButton.innerHTML = buttonText[message.traversalState];
    
  }
}

export default {
  register: () => {
    customElements.define(LinkedInButtons.elementId, LinkedInButtons)
  },
  handleMessage: LinkedInButtons.handleMessage,
}