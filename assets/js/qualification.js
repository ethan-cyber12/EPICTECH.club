'use strict';

// qualification.js
// Shows service-specific qualification prompts below the message field
// when a service is selected from the contact form dropdown.
// No form data is stored. No requests are made. No innerHTML used.

(function () {

  // What to include in the message for each service.
  // Shown as helper text — not required fields.
  var PROMPTS = {
    'Website Launch': [
      'Whether you have an existing website, or are starting from scratch',
      'The main goal (generate leads, share information, take bookings, sell products)',
      'Roughly how many pages you think you need',
      'Whether you already have a domain name',
      'Your rough budget range'
    ],
    'Website Refresh': [
      'The current website URL',
      'What is not working or looks outdated',
      'Whether the content is staying the same or changing significantly',
      'Who currently manages the site',
      'Your rough budget or target timeline'
    ],
    'Business Apps & Dashboards': [
      'What process or problem you are trying to fix',
      'Who will use this tool, and how often',
      'Whether there is a current system (spreadsheet, app) you want to replace',
      'What type of tool fits best (lead tracker, CRM, quote system, dashboard, audit tool)',
      'Your rough budget'
    ],
    'Network & Wi-Fi': [
      'What type of space this is for (office, retail, home office)',
      'Roughly how many people use the network',
      'What the main issue is (dead zones, slow speeds, no guest network, full setup needed)',
      'What router or gateway you are using now, if you know',
      'Your rough budget, not including hardware'
    ],
    'Firewall & Security': [
      'What firewall or router you are using now, if you know',
      'Roughly how many devices are on the network',
      'Whether you currently have a guest Wi-Fi network',
      'Whether you have had any recent security concerns or incidents',
      'Whether you need VPN access for remote workers'
    ],
    'Automation': [
      'What task or process you want to automate',
      'How often this task happens (daily, weekly, triggered by an event)',
      'Whether this is a Windows, Mac, or Linux environment',
      'What happens if the automation fails or stops running',
      'Your rough budget'
    ],
    'E-Commerce': [
      'What you are selling (physical products, digital downloads, services)',
      'Whether you have an existing store or are starting fresh',
      'Roughly how many products',
      'Whether you have payment processing set up already',
      'Whether you have a platform preference, or want a recommendation'
    ],
    'Monthly Support': [
      'What your current setup is (website, network, firewall, or a combination)',
      'What kind of support you need most (updates, monitoring, troubleshooting)',
      'How urgent it is when something breaks',
      'Whether anyone is currently handling IT',
      'Your rough monthly budget for support'
    ]
  };

  // Build and insert the prompt card using safe DOM methods only.
  // No innerHTML. No eval. No external requests.
  function renderPrompt(service) {
    var container = document.getElementById('qual-prompt');
    if (!container) return;

    // Clear previous prompt
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    var items = PROMPTS[service];
    if (!items) {
      container.hidden = true;
      return;
    }

    var heading = document.createElement('p');
    heading.className = 'qual-prompt-heading';
    heading.textContent = 'To help me give you a useful reply, please include:';

    var list = document.createElement('ul');
    list.className = 'qual-prompt-list';

    for (var i = 0; i < items.length; i++) {
      var li = document.createElement('li');
      li.textContent = items[i];
      list.appendChild(li);
    }

    container.appendChild(heading);
    container.appendChild(list);
    container.hidden = false;
  }

  function init() {
    var select = document.getElementById('field-service');
    if (!select) return;

    select.addEventListener('change', function () {
      renderPrompt(select.value);
    });

    // If a service is already selected on load, show its prompt.
    if (select.value) {
      renderPrompt(select.value);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
