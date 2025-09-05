console.clear();
console.log('Already injected?', window.__JOB_CONTROLLER_ALREADY_INJECTED__)

if (!window.__JOB_CONTROLLER_ALREADY_INJECTED__) {
  window.__JOB_CONTROLLER_ALREADY_INJECTED__ = true;
  console.log("Script 'linkedin_next' has been injected.")
  
  function delay (ms = 0) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  function mapSelected (selector, filter, key = 'value') {
    return Array
      .from(document.querySelectorAll(selector))
      .map(field => key ? field[key] : field)
      .filter(filter);
  }
  
  function hasEmptyInput() {
    const emptyTextInputs = mapSelected('form input[type=text][required]', value => value === '' || value === '0');
    const emptyDropdowns = mapSelected('form select', value => value === 'Select an option');
    const emptyRadioSelects = Array
      .from(document.querySelectorAll('fieldset'))
      .filter(f => f.querySelector('input[type=radio]:checked') === null);

    const totalEmpty = [].concat(emptyTextInputs, emptyDropdowns, emptyRadioSelects);

    return totalEmpty.length > 0;
  }
  
  class JobController {
    static traversalenum = {
      INACTIVE: 'INACTIVE',
      PAUSED: 'PAUSED',
      ACTIVE: 'ACTIVE'
    }
  
    constructor() {
      this.state = JobController.traversalenum.INACTIVE;

      this.nextListing = this.nextListing.bind(this);
      this.hideListing = this.hideListing.bind(this);
      this.traverseListing = this.traverseListing.bind(this);
    }
  
    startTraversal = () => {
      this.state = JobController.traversalenum.ACTIVE;
    }
  
    pauseTraversal = (message) => {
      this.state = JobController.traversalenum.PAUSED;
      if (message) console.log(message);
    }
  
    endTraversal = () => {
      this.state = JobController.traversalenum.PAUSED;
    }
  
    static getNextListing () {
      return document.querySelector(
        'li[data-occludable-job-id]:has(svg[data-test-icon=linkedin-bug-color-small]) .job-card-container--clickable'
      );
    }
  
    async nextListing() {
      // If listing is already opened, but traversal stopped due to empty field
      if (!(
        this.state === JobController.traversalenum.PAUSED && 
        document.querySelectorAll('form').length
      )) {
        const listing = JobController.getNextListing();
        
        if (!listing) { // Reached end of page
          const NextPageButton = document.querySelector('button[aria-label="View next page"]')
          NextPageButton?.click();
          return;
        }
        
        listing.click();
        
        await delay(100)
        const easyApplyButton = document.getElementById('jobs-apply-button-id');
        
        // If haven't applied, open application for current listing
        if (easyApplyButton) easyApplyButton.click();
        else { // Already applied
          this.hideListing(listing);
          return;
        }

        await delay(100);
        console.log('Executing nextListing...');
      } else {
        console.log('Continuing paused traversal...')
      }
  
      this.startTraversal();
      this.traverseListing();
    }
    
    async hideListing(listing) {
      const dismissListingBtn = listing.querySelector('.job-card-list__actions-container button');
      dismissListingBtn?.click();
      await delay(300);
      this.nextListing();
    }
    
    async traverseListing (iteration = 1) {
      console.log(`[Traversal #${iteration}]`);
      /**
       * There might be some edge case that `hasEmptyInput` missed. 
       * This prevents an infinite loop.
       */
      if (iteration > 10) return;

      if (hasEmptyInput()) {
        this.pauseTraversal('Paused due to empty form fields.');
        return;
      }
      
      const nextButton = document.querySelector('[data-easy-apply-next-button], [data-live-test-easy-apply-review-button]');
      const submitButton = document.querySelector('[data-live-test-easy-apply-submit-button]');
      
      /**
       * If reached end of application: 
       *  - uncheck "Follow [company]"
       *  - submit
       *  - close subsequent modals
       *  - go to next listing
       * Otherwise attempt to go to the next page
       */
      if (submitButton && this.state === JobController.traversalenum.ACTIVE) {
        const followCheckbox = document.getElementById('follow-company-checkbox');
        if (followCheckbox && followCheckbox.checked) followCheckbox.click();
        await delay(300);
    
        document.querySelector('[data-live-test-easy-apply-submit-button]').click();
    
        await delay(1000);
        document.querySelector('button:not(:has(svg))').click();
        
        await delay(2000);
        document.querySelector('button[data-test-modal-close-btn]')?.click(); // end of application
    
        await delay(2000);
        document.querySelector('button[data-test-modal-close-btn]')?.click(); // "application sent" confirmation
    
        this.endTraversal();

        await delay(300);
        this.nextListing();
      } else if (nextButton && this.state === JobController.traversalenum.ACTIVE) {
        nextButton.click();
        await delay(500);
        this.traverseListing(iteration + 1);
      }
    }
  }
  
  const JobAutoApply = new JobController();
  
  window.linkedinEasyApply = JobAutoApply.nextListing;
  window.linkedinHideListing = JobAutoApply.hideListing;

  window.addEventListener('message', evt => {
    console.log('Message received:', evt.data);
    if (evt.source !== window || !evt.data) return;
  
    if (evt.data.type === 'LINKEDIN_NEXT_LISTING') {
      window.linkedinEasyApply();
    } else if (evt.data.type === 'LINKEDIN_HIDE_LISTING') {
      (async () => {
        document.querySelector('button[data-test-modal-close-btn]')?.click();
        await delay(300);
        document.querySelector('button[data-control-name=discard_application_confirm_btn]')?.click();
        await delay(300);
        window.linkedinHideListing(JobController.getNextListing())
      })()
    }
  })
}