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

  const redlistStr = ['Alexander Chapman', 'Jobot', 'Dice', 'India'];
  const redlistRegex = [/research/i, /C\+\+/, /CyberCoders/i,];

  const redlistLocation = [', CA', 'Bay Area', 'San Francisco', 'California'];
  const redlistQualification = [/Lead/i, /Staff(.*)Backend/i, /java/i, /AI/, /principal/i];

  const emberID = node => Number(node?.id.split('ember')[1]);

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

    const coverLetterInput = Array.from(document.querySelectorAll('form label')).filter(l => /cover letter/i.test(l.innerText));

    const totalEmpty = [].concat(emptyTextInputs, emptyDropdowns, emptyRadioSelects, coverLetterInput);
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
      this.clickingFailed = false;
      this.setupNewPage();
      this.setupModalObserver();
      
      this.iterate = this.iterate.bind(this);
      this.click = this.click.bind(this);
      this.abandon = this.abandon.bind(this);
      this.traverseOpenListing = this.traverseOpenListing.bind(this);
      this.goToNextPage = this.goToNextPage.bind(this);
    }
    
    get listingIsOpen() {
      return !!document.getElementById('artdeco-modal-outlet')?.childNodes.length
    }

    get scrollContainer() {
      const anyListing = document.querySelector('li[data-occludable-job-id]');
      const scrollContainer = anyListing?.parentElement?.parentElement;
      return scrollContainer;
    }
    
    shouldSkipListing() {
      const listingRoot = document.querySelector('.jobs-details__main-content');
      const title = listingRoot.querySelector('h1').textContent;
      const jobMetadata = listingRoot.querySelector('.job-details-jobs-unified-top-card__primary-description-container').textContent;
      const description = listingRoot.querySelector('.jobs-description__content, .jobs-description-content').textContent.replace(/\s+/g, ' ');
      
      const redlistChecks = {
        unqualified: redlistQualification.map(r => r.test(title)).filter(Boolean).length > 0,
        undesirableLocation: redlistLocation.map(l => jobMetadata.indexOf(l) > -1).filter(Boolean).length > 0,
        redlistKeyword: [].concat(
          redlistStr.map(r => listingRoot.textContent.indexOf(r) > -1).filter(Boolean),
          redlistRegex.map(r => r.test(listingRoot.textContent)).filter(Boolean)
        ).length > 0,
      }
      
      const shouldSkip = Object.values(redlistChecks).filter(Boolean).length > 0;
      if (shouldSkip) {
        console.log(`Skipping "${title}": `, redlistChecks);
      }
      
      return shouldSkip;
    }

    setupModalObserver() {
      this.modalObserver = new MutationObserver((mutations) => {
        const hasAddedNodes = mutations.some(mutation =>
          mutation.type === 'childList' && mutation.addedNodes.length > 0
        );

        if (hasAddedNodes) {
          console.log('Modal opened!');
          this.modalObserver.disconnect(); // optional: stop watching after first open
          this.traverseOpenListing();
        }
      });
    }

    observeModalOpen() {
      this.modalObserver.observe(
        document.getElementById('artdeco-modal-outlet'), {
          childList: true,
        }
      )
    }
    
    setupNewPage() {
      this.listIndex = 0;
      this.listings = Array.from(document.querySelectorAll('li[data-occludable-job-id]'))
      console.log('Listings:', this.listings.length)
    }
    
    async iterate() {
      if (this.listingIsOpen) {
        console.log('Continuing with open listing...')
        await this.traverseOpenListing();
        return;
      }

      await this.goToNextListing();

      if (this.reachedEndOfListings || this.clickingFailed) {
        console.log('Reached end of listings.');
        this.clickingFailed = false; // Reset
        return;
      }

      if (this.shouldSkipListing()) {
        return this.iterate();
      }
      
      const title = document.querySelector('h1').textContent;
      console.log(`Checking job: ${title}`)

      if (isEasyApply(this.root)) return this._handleEasyApply();
      else return await this._handleExternalApply();
    }

    async goToNextListing() {
      if (this.listIndex >= this.listings.length) {
        console.log('Reached end of page, going to next page...')
        await this.goToNextPage();
      } 
    
      if (!this.reachedEndOfListings) {
        console.log('Opening next listing...');
        this.root = this.listings[this.listIndex++]
        this.root.scrollIntoView({ block: 'nearest' });
        this.scrollContainer?.dispatchEvent(new Event('scroll'));

        await this.click();
      }
    }
    
    async goToNextPage() {
      const NextPageButton = document.querySelector('button[aria-label="View next page"]');
      if (NextPageButton) {
        NextPageButton.click();
        await delay(1000);
        this.setupNewPage();
      }
      else this.reachedEndOfListings = true;
    }
    
    async click() {
      const clickable = this.root?.querySelector('.job-card-container--clickable');
      if (!clickable) {
        console.log('Clicking failed', this.root);
        this.clickingFailed = true;
        return;
      }
      clickable.click();      
      await delay(3000);
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
    
    _handleEasyApply() {
      console.log('Easy apply detected');
      const easyApplyButton = document.getElementById('jobs-apply-button-id');
      if (!easyApplyButton) {
        console.log('Already applied, continuing...')
        return this.iterate();
      }

      easyApplyButton.click();
      console.log('Opening easy apply application.')
      this.observeModalOpen();
    }

    async _handleExternalApply() {
      const saveJobButton = document.querySelector('button.jobs-save-button');
      // Listing state on sidebar is inconsistent, so this check has to be done again on the job description
      const alreadySaved = /saved/i.test(saveJobButton?.textContent);
      if (!alreadySaved && saveJobButton) {
        saveJobButton.click();
        console.log('Saved job: ', document.querySelector('h1')?.textContent)
        await delay(300);
      } else {
        console.log('Job already saved. Continuing...')
      }

      this.iterate();
    } 
    
    async traverseOpenListing(iteration = 1) {
      if (iteration > 10) return;
      console.log('Attempting to traverse open listing...')

      if (hasEmptyInput()) {
        console.log('Paused due to empty form fields.');
        window.postMessage({ type: 'LINKEDIN_AUTOFILL', ext_source: 'INJ_SCRIPT' }, '*');
        return;
      }

      const nextButton = document.querySelector('[data-easy-apply-next-button], [data-live-test-easy-apply-review-button]');
      const submitButton = document.querySelector('[data-live-test-easy-apply-submit-button]');

      if (submitButton) this.handleSubmit(submitButton);
      else if (nextButton) {
        console.log('Going to next application page.')
        nextButton.click();
        await delay(300);
        await this.traverseOpenListing(iteration + 1);
      } else {
        console.error('Unable to find "Next" or "Submit" buttons.')
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
      
      console.log('Application submitted!')
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
    LINKEDIN_HIDE_LISTING: ListingHandler.abandon,
    CHECK_EMPTY_INPUTS: hasEmptyInput,
  }
  
  window.addEventListener('message', evt => {
    if (evt.source !== window || !evt.data || !evt.data.ext_source) return;
    if (evt.data.ext_source === 'INJ_SCRIPT') return;

    console.log('Message received:', evt.data);
    window.__mvEventHandler__[evt.data.type]?.();
  })
}