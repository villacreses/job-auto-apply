const traversalEnum = {
  INACTIVE: 'INACTIVE',
  PAUSED: 'PAUSED',
  ACTIVE: 'ACTIVE'
}

const getNextListing = () =>
  document.querySelector('li[data-occludable-job-id]:has(svg[data-test-icon=linkedin-bug-color-small]) .job-card-container--clickable');

const state = (function (){
  let state = traversalEnum.INACTIVE;

  const _updateState = (newState) => {
    state = newState;

    const message = {
      source: 'CONTENT_LINKEDIN',
      target: 'EXT_DOM',
      handler: 'LINKEDIN',
      content: {
        traversalState: state,
      }
    };

    console.log('Sending message:', message);
    chrome.runtime.sendMessage(message);
  }

  return {
    getState: () => state,
    startTraversal: () => _updateState(traversalEnum.ACTIVE),
    pauseTraversal: () => _updateState(traversalEnum.PAUSED),
    endTraversal: () => _updateState(traversalEnum.INACTIVE)
  }
})()


const delay = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));
const mapSelected = (selector, filter) => Array.from(document.querySelectorAll(selector)).map(field => field.value).filter(filter);

function hasEmptyInput() {
  const emptyTextInputs = mapSelected('form input[type=text]', value => value === '' || value === '0');
  const emptyDropdowns = mapSelected('form select', value => value === 'Select an option');

  return !!(emptyTextInputs.length + emptyDropdowns.length);
}

async function traverseListing(iteration = 1) {
  if (iteration > 10) return;

  if (hasEmptyInput()) {
    state.pauseTraversal();
    console.log('Paused due to empty form fields.');
    return;
  } 

  console.log(`[Traversal #${iteration}]`);
  const nextButton = document.querySelector('[data-easy-apply-next-button], [data-live-test-easy-apply-review-button]');
  const submitButton = document.querySelector('[data-live-test-easy-apply-submit-button]');
  
  if (submitButton && state.getState() === traversalEnum.ACTIVE) {
    const followCheckbox = document.getElementById('follow-company-checkbox');
    if (followCheckbox && followCheckbox.checked) followCheckbox.click();

    document.querySelector('[data-live-test-easy-apply-submit-button]').click();

    await delay(1000);
    document.querySelector('button:not(:has(svg))').click();
    
    await delay(2000);
    document.querySelector('button[data-test-modal-close-btn]')?.click(); // end of application

    await delay(2000);
    document.querySelector('button[data-test-modal-close-btn]')?.click(); // "application sent" confirmation

    state.endTraversal();
  } else if (nextButton && state.getState() === traversalEnum.ACTIVE) {
    nextButton.click();
    await delay(500);
    traverseListing(iteration + 1);
  }
}

async function nextListing () {
  if (state.getState() === traversalEnum.PAUSED && document.querySelectorAll('form').length) {
    console.log('Continuing paused traversal...')
    state.startTraversal();
    traverseListing();
    return;
  }
  
  console.log('Executing nextListing...');
  state.startTraversal();
  
  const listing = getNextListing();
  if (!listing) return;
  listing.click();
  
  await delay(100)
  document.getElementById('jobs-apply-button-id').click();
  await delay(100);
  traverseListing()
}

function abandonListing() {
  const listing = getNextListing();
}

console.log('LinkedIn content script loaded.')

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received from page:', message);
  sendResponse({ res: 200 });
  
  if (message.action === 'LINKEDIN_NEXT_LISTING') {
    nextListing();
  } else if (message.action === 'LINKEDIN_ABORT_LISTING') {
    abandonListing();
  }
});