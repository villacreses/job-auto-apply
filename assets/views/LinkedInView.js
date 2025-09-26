
import { AbstractView } from "./AbstractView.js";

const buttonText = {
  INACTIVE: 'Start Easy Apply',
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
      'linkedin_next.js',
      'linkedin_regex.js',
    ]);
  }
}

export default {
  register: LinkedInView.register.bind(LinkedInView),
}