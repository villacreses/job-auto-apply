
import { AbstractView } from "./AbstractView.js";

const buttonText = {
  INACTIVE: 'Next Listing',
  PAUSED: 'Continue',
  ACTIVE: 'Running'
}

class LinkedInView extends AbstractView {
  static _elementId = 'linkedin-view'

  constructor() {
    super([
      {
        buttonText: buttonText.INACTIVE,
        action: 'LINKEDIN_NEXT_LISTING',
        className: 'primary'
      },
      {
        buttonText: 'Abandon Listing',
        action: 'LINKEDIN_HIDE_LISTING',
        className: 'abort'
      },
    ], [
      'linkedin_next.js'
    ]);
  }
}

export default {
  register: () => {
    customElements.define(LinkedInView._elementId, LinkedInView)
  },
}