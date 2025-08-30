const traversalEnum = {
  INACTIVE: 'INACTIVE',
  PAUSED: 'PAUSED',
  ACTIVE: 'ACTIVE'
}

const state = (function (){
  let state = traversalEnum.INACTIVE;

  const _updateState = (newState) => {
    state = newState;

    chrome.runtime.sendMessage({
      website: 'LINKEDIN',
      contentState: {
        traversalState: state,
      }
    })
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

function traverseListing(iteration = 1) {
  if (iteration > 10) return;

  if (hasEmptyInput()) {
    state.pauseTraversal();
    console.log('Paused due to empty form fields.');
    return;
  } 

  console.log(`[Traversal #${iteration}]`);
  const nextButton = document.querySelector('[data-easy-apply-next-button], [data-live-test-easy-apply-review-button]');
  const submitButton = document.querySelector('[data-live-test-easy-apply-submit-button]');
  if (submitButton) {
    const followCheckbox = document.getElementById('follow-company-checkbox');
    if (followCheckbox && followCheckbox.checked) followCheckbox.click();

    document.querySelector('[data-live-test-easy-apply-submit-button]').click();

    delay(1000)
      .then(() => document.querySelector('button:not(:has(svg))').click())
      .then(delay(2000))
      .then(() => document.querySelector('button[data-test-modal-close-btn]')?.click()) // end of application
      .then(delay(2000))
      .then(() => document.querySelector('button[data-test-modal-close-btn]')?.click()) // "application sent" confirmation
      .then(state.endTraversal)
  } else if (nextButton && state.getState() === traversalEnum.ACTIVE) {
    nextButton.click();
    delay(500).then(() => traverseListing(iteration + 1));
  }
}

function nextListing () {
  if (state.getState() === traversalEnum.PAUSED && document.querySelectorAll('form').length) {
    state.startTraversal();
    traverseListing();
    return;
  }
  
  console.log('Executing nextListing...');
  state.startTraversal();
  
  const listing = document.querySelector('li[data-occludable-job-id]:has(svg[data-test-icon=linkedin-bug-color-small]) .job-card-container--clickable');
  if (!listing) return;
  listing.click();
  delay(100)
    .then(() => document.getElementById('jobs-apply-button-id').click())
    .then(() => delay(100))
    .then(traverseListing)
}

console.log('LinkedIn content script loaded.')

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message)
  console.log('E', message.action, message.action === 'LINKEDIN_NEXT_LISTING')

  if (message.action === 'LINKEDIN_NEXT_LISTING') {
    console.log('reached 1')
    nextListing();
  }
});