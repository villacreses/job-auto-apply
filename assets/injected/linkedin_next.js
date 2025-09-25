console.clear();
// console.log('Already injected?', window.__JOB_CONTROLLER_ALREADY_INJECTED__)

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

  const redlistStr = [', CA', 'Alexander Chapman', 'California', 'Jobot', 'Dice', 'San Francisco', 'Bay Area'];
  const redlistRegex = [/research/i, /principal/i, /staff(.*)backend/i, /C\+\+/, /CyberCoders/i];

  const greenlistStr = ['fullstack']

  function hasMatches(stringArr, regexArr) {
    const desc = document.querySelector('.job-view-layout').textContent.replace(/\n/g, '').replace(/\s+/g, ' ');
    const _stringArr = Array.isArray(stringArr) ? stringArr : []
    const _regexArr = Array.isArray(regexArr) ? regexArr : []

    const stringMatches = (_stringArr || []).map(str => desc.match(str)).filter(Boolean);
    const regexMatches = _regexArr.map(r => r.test(desc)).filter(Boolean);

    const totalMatches = [].concat(stringMatches, regexMatches);
    return totalMatches.length > 0;
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
  const listOfJobsExists = () => !!document.querySelector('.scaffold-layout__list');

  const isEasyApply = (context) => listOfJobsExists()
    ? !!context.querySelector(':has(svg[data-test-icon=linkedin-bug-color-small])')
    : !!document.getElementById('jobs-apply-button-id');

  const isInSingleJobView = () => {
    const jobPostingOpen = !!document.querySelector('.job-view-layout');
    return jobPostingOpen && !listOfJobsExists;
  }

  class ListingController {
    constructor() {
      this.root = null;
      this.reachedEndOfListings = false;

      this.iterate = this.iterate.bind(this);
      this.next = this.next.bind(this);
      this.click = this.click.bind(this);
      this.abandon = this.abandon.bind(this);
      this.traverse = this.traverse.bind(this);
      this.goToNextPage = this.goToNextPage.bind(this);
    }

    get listingIsOpen() {
      return document.querySelectorAll('form').length > 0;
    }

    get filter() {
      return (listing) => {
        const listingStatus = listing.querySelector('job-card-container__footer-job-state')?.textContent
        const alreadyApplied = listingStatus === 'Applied';
        const alreadySaved = listingStatus === 'Saved';
        return !alreadyApplied && !alreadySaved && isEasyApply(listing);
      }
    }

    async iterate() {
      if (this.listingIsOpen) {
        console.log('Continuing open listing...')
        this.traverse();
        return;
      }

      await this.next();
      this.click();
      await delay(500);

      if (hasMatches(redlistStr, redlistRegex)) {
        console.log('Skipping due to redlist match...');
        this.abandon();
        return;
      }

      if (isEasyApply(this.root)) {
        console.log(`'Easy apply' detected. Managing application flow...`)
        this._handleEasyApply();
      } else if (shouldGreenlist()) {

      }
    }

    async next() {
      const allListings = Array.from(document.querySelectorAll('li[data-occludable-job-id]'));
      this.root = allListings.filter(this.filter)[0];

      if (!this.root) {
        this.goToNextPage();
        await delay(300);
        return this.next();
      }

      if (this.reachedEndOfListings) return null;
      return this;
    }

    goToNextPage() {
      const NextPageButton = document.querySelector('button[aria-label="View next page"]');
      if (NextPageButton) NextPageButton.click();
      else this.reachedEndOfListings = true;
    }

    async click() {
      const clickable = this.root.querySelector('.job-card-container--clickable');
      if (!clickable) {
        console.log('Clicking failed');
        return;
      }
      clickable.click();      
    }

    async abandon() {
      document.querySelector('button[data-test-modal-close-btn]')?.click();
      await delay(300);
      
      document.querySelector('button[data-control-name=discard_application_confirm_btn]')?.click();
      await delay(300);

      const dismissListingBtn = this.root.querySelector('.job-card-list__actions-container button');
      dismissListingBtn?.click();
      await delay(300);

      return this.iterate();
    }
    
    async _handleEasyApply() {
      const easyApplyButton = document.getElementById('jobs-apply-button-id');
      if (!easyApplyButton) return;
      easyApplyButton.click();
      delay(1000);

      this.traverse();
    }
    
    async traverse(iteration = 1) {
      if (iteration > 10) return;
      await delay(1000)

      if (hasEmptyInput()) {
        console.log('Paused due to empty form fields.');
        window.postMessage({ type: 'LINKEDIN_AUTOFILL', ext_source: 'INJ_SCRIPT' }, '*');
        return;
      }

      const nextButton = document.querySelector('[data-easy-apply-next-button], [data-live-test-easy-apply-review-button]');
      const submitButton = document.querySelector('[data-live-test-easy-apply-submit-button]');

      if (submitButton) this.handleSubmit(submitButton);
      else if (nextButton) {
        nextButton.click();
        await delay(300);
        this.traverse(iteration + 1);
      }
    }

    /**
      * If reached end of application: 
      *  - uncheck "Follow [company]"
      *  - submit
      *  - close subsequent modals
      */
    async handleSubmit(submitButton) {
      const followCheckbox = document.getElementById('follow-company-checkbox');
      if (followCheckbox && followCheckbox.checked) followCheckbox.click();
      await delay(300);
    
      submitButton.click();
      await delay(1000);

      document.querySelector('button:not(:has(svg))').click();
      await delay(2000);
      
      document.querySelector('button[data-test-modal-close-btn]')?.click(); // end of application
      await delay(2000);
      
      document.querySelector('button[data-test-modal-close-btn]')?.click(); // "application sent" confirmation
      await delay(500);

      this.iterate();
    }
  }

  const ListingHandler = new ListingController();

  window.__mvEventHandler__ = {
    LINKEDIN_NEXT_LISTING: ListingHandler.iterate,
    LINKEDIN_HIDE_LISTING: ListingHandler.abandon
  }
  
  window.addEventListener('message', evt => {
    if (evt.source !== window || !evt.data || !evt.data.ext_source) return;
    if (evt.data.ext_source === 'INJ_SCRIPT') return;

    console.log('Message received:', evt.data);
    window.__mvEventHandler__[evt.data.type]?.();
  })
}