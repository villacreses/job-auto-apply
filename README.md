# job-auto-apply
The competition for jobs is getting tough. Modern problems require modern solutions.

### TODO


#### Easy Apply
- [x] Make extension work for Easy Apply jobs
  - [x] Handle repetitive inputs
  - [x] Eliminate race conditions

#### External job postings

Currently the Easy Apply script saves all external job postings. Starting at the "saved jobs" page, I'd like a new master script that 
does the following:

1. Go to the next job on the list (tracked by index?)
2. If it's an external job posting, click "Apply"
3. If it's a common application site (e.g. Greenhouse, Ashby HQ, etc), execute the corresponding autofill script on the corresponding tab.
  - At the end of the script
    - A message will be sent to the master script to continue.
    - The tab that ran the script will close itself.
4. If "CONTINUE" message is received:
  a. click Yes on LinkedIn's "Did you apply" prompt
  b. Go back to the listings and increment list index
  c. If list index is out of range, go to next page. 
  d. Repeat process from step 1.

Action items:

- [] Write master script to achieve basic iteration and "Apply" clickthrough
  - [] Skip "Easy Apply" listings (clearly I saved them for manual traversal)
- [] Write autofill script for common job posting sites:
  - [] Greenhouse
  - [] Ashby HQ
- [] Write the listener for "CONTINUE" message
- [] Ensure master script and "common site" scripts work together fluidly in iteration.

### AI Prompt

- **Cover letter:** Content in selector '.job-view-layout' is a job I'm applying for. My career history is open in another tab. Write a short cover letter for the job; character limit 1000.