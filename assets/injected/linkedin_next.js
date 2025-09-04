console.log("Script 'linkedin_next' has been injected.")

function delay (ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function mapSelected (selector, filter) {
  return Array.from(document.querySelectorAll(selector)).map(field => field.value).filter(filter);
}

function hasEmptyInput() {
  const emptyTextInputs = mapSelected('form input[type=text]', value => value === '' || value === '0');
  const emptyDropdowns = mapSelected('form select', value => value === 'Select an option');

  return !!(emptyTextInputs.length + emptyDropdowns.length);
}

class JobController {
  static traversalenum = {
    INACTIVE: 'INACTIVE',
    PAUSED: 'PAUSED',
    ACTIVE: 'ACTIVE'
  }

  constructor() {
    this.state = JobController.traversalenum.INACTIVE;
  }

  startTraversal = () => {
    this.state = JobController.traversalenum.ACTIVE;
  }

  pauseTraversal = () => {
    this.state = JobController.traversalenum.PAUSED;
  }

  endTraversal = () => {
    this.state = JobController.traversalenum.PAUSED;
  }

  static getNextListing = () => document.querySelector(
    'li[data-occludable-job-id]:has(svg[data-test-icon=linkedin-bug-color-small]) .job-card-container--clickable'
  );

  nextListing = async () => {
    if (!(
      this.state === JobController.traversalenum.PAUSED && 
      document.querySelectorAll('form').length
    )) {
      const listing = JobController.getNextListing();
      if (!listing) return;
      listing.click();
      
      await delay(100)
      const applyButton = document.getElementById('jobs-apply-button-id');
      if (applyButton) applyButton.click();
      else {
        JobController.hideListing(listing);
        return;
      }
      await delay(100);
      
      console.log('Executing nextListing...');
    } else {
      console.log('Continuing paused traversal...')
    }

    this.startTraversal();
    this.traverseListing()
  }

  static hideListing(listing) {
    console.log('Listing', listing)
  }

  traverseListing = async (iteration = 1) => {
    if (iteration > 10) return;
  
    if (hasEmptyInput()) {
      this.pauseTraversal();
      console.log('Paused due to empty form fields.');
      return;
    } 
  
    console.log(`[Traversal #${iteration}]`);
    const nextButton = document.querySelector('[data-easy-apply-next-button], [data-live-test-easy-apply-review-button]');
    const submitButton = document.querySelector('[data-live-test-easy-apply-submit-button]');
    
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
    } else if (nextButton && this.state === JobController.traversalenum.ACTIVE) {
      nextButton.click();
      await delay(500);
      this.traverseListing(iteration + 1);
    }
  }
}

const JobAutoApply = new JobController();

window.linkedinEasyApply = JobAutoApply.nextListing;

window.addEventListener('message', evt => {
  console.log('Message received:', evt.data);
  if (evt.source !== window || !evt.data) return;

  if (evt.data.type === 'LINKEDIN_NEXT_LISTING') {
    window.linkedinEasyApply();
  } else if (evt.data.type === 'LINKEDIN_HIDE_LISTING') {
    document.querySelector('button[data-test-modal-close-btn]')?.click();
    
    delay(300).then(() => 
      JobController.hideListing(JobController.getNextListing())
    );
  }
})
