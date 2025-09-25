console.log('Already injected?', window.__REGEX_HANDLER_ALREADY_INJECTED__)

if (!window.__REGEX_HANDLER_ALREADY_INJECTED__) {
  window.__JOB_CONTROLLER_ALREADY_INJECTED__ = true;
  
  function autofill() {
    console.log('Filling common questions, if any....');
    handleFieldsets();
    handleDropdowns();
  }
  
  const regex = [
    { regex: /legally(.*)authorized/i, defaultYes: true },
    { regex: /authorized(.*)work/i, defaultYes: true },
    { regex: /comfortable(.*)commuting/i, defaultYes: true },
    { regex: /future(.*)visa/i, defaultYes: false },
    { regex: /sponsor(.*)visa/i, defaultYes: false },
    { regex: /visa(.*)sponsor/i, defaultYes: false },
    { regex: /currently(.*)work/i, defaultYes: false },
  ];

  function handleFieldsets() {  
    const fieldsets = Array.from(document.querySelectorAll('fieldset'))
      .map(f => ({
        question: f.querySelector('legend span span')?.textContent,
        options: f.querySelectorAll('label'),
      }))
      .filter(({question}) => question.trim().length)
      
    if (fieldsets.length === 0) return;
    
    regex.map(({regex, defaultYes}) => ({
      ...(fieldsets.find(f => regex.test(f.question)) || {}),
      defaultYes
    }))
    .filter(foundMatch => foundMatch.question)
    .forEach(({defaultYes, options}) => {
      if (defaultYes) options[0]?.click();
      else options[1]?.click();
    })
  }

  function handleDropdowns() {  
    const dropdowns = Array.from(document.querySelectorAll('form select'))
      .map(f => ({
        ent: f,
        question: document.querySelector(`label[for=${f.id}] span`)?.textContent,
        options: f.querySelectorAll('option'),
      }))
      .filter(({question}) => question.trim().length)
      
    if (dropdowns.length === 0) return;
    
    regex.map(({regex, defaultYes}) => ({
      ...(dropdowns.find(f => regex.test(f.question)) || {}),
      defaultYes
    }))
    .filter(foundMatch => foundMatch.question)
    .forEach(({defaultYes, options, ent}) => {
      // options[0] is the select prompt
      ent.value = defaultYes ? options[1].value : options[2].value;
      ent.dispatchEvent(new Event('change', { bubbles: true }));
    })
  }

    window.__linkedin_formEventHandler__ = {
      LINKEDIN_AUTOFILL: autofill,
    }

    window.addEventListener('message', evt => {
      if (evt.source !== window || !evt.data || !evt.data.ext_source) return;

      if (evt.data.ext_source === 'INJ_SCRIPT') {
        window.__linkedin_formEventHandler__[evt.data.type]?.();
      }
    })
}
