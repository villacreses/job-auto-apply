const delay = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));
const mapSelected = (selector, filter) => Array.from(document.querySelectorAll(selector)).map(field => field.value).filter(filter);

function hasEmptyInput() {
  const emptyTextInputs = mapSelected('form input[type=text]', value => value === '' && value === '0');
  const emptyDropdowns = mapSelected('form select', value => value === 'Select an option');
  return !!(emptyTextInputs.length + emptyDropdowns.length);
}

function traverseListing(iteration = 1) {
  if (hasEmptyInput()) return;
  console.log(`[Traverse #${iteration}]`);
  const nextButton = document.querySelector('[data-easy-apply-next-button], [data-live-test-easy-apply-review-button]');
  const submitButton = document.querySelector('[data-live-test-easy-apply-submit-button]');
  if (submitButton) {
    const followCheckbox = document.getElementById('follow-company-checkbox');
    if (followCheckbox && followCheckbox.checked) followCheckbox.click();

    document.querySelector('[data-live-test-easy-apply-submit-button]').click();

    delay(1000)
      .then(() => document.querySelector('button:not(:has(svg))').click())
      .then(delay(2000))
      .then(() => document.querySelector('button[aria-label=dismiss]')?.click())
  } else if (nextButton) {
    nextButton.click();
    delay(500).then(() => traverseListing(iteration + 1));
  }
}

function nextListing () {
  const listing = document.querySelector('li[data-occludable-job-id]:has(svg[data-test-icon=linkedin-bug-color-small]) .job-card-container--clickable');
  if (!listing) return;
  listing.click();
  delay(100)
    .then(() => document.getElementById('jobs-apply-button-id').click())
    .then(() => delay(100))
    .then(traverseListing)
}

function test() {
  console.log('LinkedIn content script works.')
}

console.log('Linkin content script loaded.')