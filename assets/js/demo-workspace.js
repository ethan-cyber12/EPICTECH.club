'use strict';

/* Interactive business-app demo for the Business Apps & Dashboards page.
   Every record below is invented sample data. The module reads nothing,
   stores nothing and sends nothing: there is no network call, no storage,
   no analytics and no production connection of any kind.

   All rendering goes through createElement and textContent. No innerHTML is
   used anywhere in this file, so demo strings can never be parsed as markup. */

(function () {
  var root = document.querySelector('[data-demo-workspace]');
  if (!root) return;

  var WORKSPACES = {
    leads: {
      kicker: 'Pipeline overview',
      title: 'Lead Desk',
      description: 'See every inquiry, owner, and next step without searching across inboxes.',
      filters: ['All', 'New', 'Contacted', 'Planning', 'Proposal'],
      columns: ['Lead', 'Status', 'Owner', 'Next step'],
      metrics: [
        ['Open inquiries', '7', 'Across four sample stages'],
        ['Needs follow-up', '3', 'Sample dates only'],
        ['In planning', '2', 'Workflow discovery'],
        ['Proposal ready', '1', 'Waiting for review']
      ],
      rows: [
        {
          id: 'L-104', name: 'Demo: Citrus Works', sub: 'Website inquiry',
          status: 'New', owner: 'Alex', next: 'Review goals', tone: 'blue',
          summary: 'A sample website inquiry that needs an initial scope conversation.',
          details: [['Source', 'Website form'], ['Priority', 'Normal'], ['Received', 'Sep 4 (sample)'], ['Next action', 'Confirm discovery call']],
          action: 'Mark as contacted'
        },
        {
          id: 'L-103', name: 'Demo: Harbor and Pine', sub: 'Lead tracking',
          status: 'Planning', owner: 'Morgan', next: 'Map required fields', tone: 'violet',
          summary: 'A fictional service company wants one place to track inquiries and follow-ups.',
          details: [['Source', 'Referral'], ['Priority', 'High'], ['Received', 'Sep 2 (sample)'], ['Next action', 'Draft workflow map']],
          action: 'Open planning notes'
        },
        {
          id: 'L-102', name: 'Demo: Northstar Studio', sub: 'Network review',
          status: 'Contacted', owner: 'Alex', next: 'Confirm site visit', tone: 'amber',
          summary: 'A sample office network review awaiting a scheduling decision.',
          details: [['Source', 'Email'], ['Priority', 'Normal'], ['Received', 'Aug 30 (sample)'], ['Next action', 'Offer two times']],
          action: 'Prepare follow-up'
        },
        {
          id: 'L-101', name: 'Demo: Lakehouse Market', sub: 'Quote workflow',
          status: 'Proposal', owner: 'Morgan', next: 'Review draft scope', tone: 'green',
          summary: 'A fictional quote-tracking workflow with a first scope ready for review.',
          details: [['Source', 'Website form'], ['Priority', 'Normal'], ['Received', 'Aug 28 (sample)'], ['Next action', 'Send draft scope']],
          action: 'Review sample scope'
        },
        {
          id: 'L-100', name: 'Demo: Field and Finch', sub: 'Follow-up system',
          status: 'Contacted', owner: 'Alex', next: 'Collect process notes', tone: 'amber',
          summary: 'A sample request to replace a shared follow-up spreadsheet.',
          details: [['Source', 'Referral'], ['Priority', 'Low'], ['Received', 'Aug 26 (sample)'], ['Next action', 'Collect example rows']],
          action: 'Add sample note'
        }
      ]
    },

    jobs: {
      kicker: 'Delivery view',
      title: 'Job Board',
      description: 'Keep scheduled work, ownership, dependencies, and handoff status in one view.',
      filters: ['All', 'Scheduled', 'In progress', 'Review', 'Handoff'],
      columns: ['Work item', 'Status', 'Assigned', 'Due'],
      metrics: [
        ['Active work', '6', 'Sample records'],
        ['This week', '4', 'Across all stages'],
        ['Needs review', '2', 'Owner decision needed'],
        ['Ready to hand off', '1', 'Documentation included']
      ],
      rows: [
        {
          id: 'J-208', name: 'Demo: Guest Wi-Fi plan', sub: 'Network project',
          status: 'Scheduled', owner: 'Alex', next: 'Sep 8', tone: 'blue',
          summary: 'A fictional network cleanup scheduled for review and documentation.',
          details: [['Client', 'Demo Workspace'], ['Dependency', 'Current device list'], ['Window', 'Morning (sample)'], ['Next action', 'Confirm access plan']],
          action: 'View checklist'
        },
        {
          id: 'J-207', name: 'Demo: Service page refresh', sub: 'Website project',
          status: 'In progress', owner: 'Morgan', next: 'Sep 7', tone: 'amber',
          summary: 'A sample service-page update moving through content and layout work.',
          details: [['Client', 'Demo Workspace'], ['Dependency', 'Approved copy'], ['Progress', '3 of 5 checks'], ['Next action', 'Review mobile layout']],
          action: 'Open review list'
        },
        {
          id: 'J-206', name: 'Demo: Intake form', sub: 'Internal tool',
          status: 'Review', owner: 'Alex', next: 'Sep 6', tone: 'violet',
          summary: 'A fictional intake form awaiting an owner decision on required fields.',
          details: [['Client', 'Demo Workspace'], ['Dependency', 'Field approval'], ['Progress', 'Draft ready'], ['Next action', 'Approve required fields']],
          action: 'Review decisions'
        },
        {
          id: 'J-205', name: 'Demo: Lead board v1', sub: 'Business app',
          status: 'Handoff', owner: 'Morgan', next: 'Sep 5', tone: 'green',
          summary: 'A sample first version ready for walkthrough and documented handoff.',
          details: [['Client', 'Demo Workspace'], ['Dependency', 'Walkthrough'], ['Progress', 'Checks complete'], ['Next action', 'Schedule handoff']],
          action: 'View handoff notes'
        },
        {
          id: 'J-204', name: 'Demo: DNS review', sub: 'Website care',
          status: 'Review', owner: 'Alex', next: 'Sep 9', tone: 'violet',
          summary: 'A fictional DNS review with changes held for explicit approval.',
          details: [['Client', 'Demo Workspace'], ['Dependency', 'Owner approval'], ['Progress', 'Plan ready'], ['Next action', 'Review proposed change']],
          action: 'Review plan'
        }
      ]
    },

    quotes: {
      kicker: 'Decision tracking',
      title: 'Quote Tracker',
      description: 'Track draft scopes, client decisions, totals, and what needs attention next.',
      filters: ['All', 'Draft', 'Sent', 'Approved', 'Archived'],
      columns: ['Quote', 'Status', 'Amount', 'Updated'],
      metrics: [
        ['Open quotes', '5', 'Invented examples'],
        ['Draft value', '$4.8k', 'Sample amount'],
        ['Sent', '2', 'Awaiting a decision'],
        ['Approved', '1', 'Sample status']
      ],
      rows: [
        {
          id: 'Q-038', name: 'Demo: Workflow dashboard', sub: 'Q-038',
          status: 'Draft', owner: '$2,400', next: 'Sep 5', tone: 'blue',
          summary: 'A fictional first-version dashboard scope with example pricing.',
          details: [['Client', 'Demo: Harbor and Pine'], ['Prepared by', 'EPIC TECH demo'], ['Valid through', 'Sample date'], ['Next action', 'Review scope items']],
          action: 'Review sample quote'
        },
        {
          id: 'Q-037', name: 'Demo: Website refresh', sub: 'Q-037',
          status: 'Sent', owner: '$1,800', next: 'Sep 3', tone: 'amber',
          summary: 'A sample website refresh quote awaiting a fictional client response.',
          details: [['Client', 'Demo: Citrus Works'], ['Prepared by', 'EPIC TECH demo'], ['Sent', 'Sep 3 (sample)'], ['Next action', 'Follow up Sep 9']],
          action: 'Prepare follow-up'
        },
        {
          id: 'Q-036', name: 'Demo: Network plan', sub: 'Q-036',
          status: 'Approved', owner: '$750', next: 'Sep 1', tone: 'green',
          summary: 'A fictional approved planning engagement ready to schedule.',
          details: [['Client', 'Demo: Northstar Studio'], ['Prepared by', 'EPIC TECH demo'], ['Decision', 'Approved (sample)'], ['Next action', 'Schedule planning']],
          action: 'View next steps'
        },
        {
          id: 'Q-035', name: 'Demo: Intake form', sub: 'Q-035',
          status: 'Sent', owner: '$1,150', next: 'Aug 30', tone: 'amber',
          summary: 'A sample internal-form quote with a decision still pending.',
          details: [['Client', 'Demo: Field and Finch'], ['Prepared by', 'EPIC TECH demo'], ['Sent', 'Aug 30 (sample)'], ['Next action', 'Confirm questions']],
          action: 'Open activity'
        },
        {
          id: 'Q-034', name: 'Demo: Retired concept', sub: 'Q-034',
          status: 'Archived', owner: '$900', next: 'Aug 18', tone: 'rose',
          summary: 'An invented quote kept as a read-only example of a closed path.',
          details: [['Client', 'Demo Workspace'], ['Prepared by', 'EPIC TECH demo'], ['Closed', 'Aug 18 (sample)'], ['Reason', 'Scope changed']],
          action: 'View archive note'
        }
      ]
    }
  };

  var ORDER = ['leads', 'jobs', 'quotes'];

  var state = {
    workspace: 'leads',
    filter: 'All',
    search: '',
    selected: null
  };

  var el = {
    tabs: Array.prototype.slice.call(root.querySelectorAll('[data-demo-tab]')),
    kicker: root.querySelector('[data-demo-kicker]'),
    title: root.querySelector('[data-demo-title]'),
    description: root.querySelector('[data-demo-description]'),
    metrics: root.querySelector('[data-demo-metrics]'),
    filters: root.querySelector('[data-demo-filters]'),
    head: root.querySelector('[data-demo-head]'),
    body: root.querySelector('[data-demo-body]'),
    tableWrap: root.querySelector('[data-demo-table-wrap]'),
    empty: root.querySelector('[data-demo-empty]'),
    detail: root.querySelector('[data-demo-detail]'),
    search: root.querySelector('[data-demo-search]'),
    reset: root.querySelector('[data-demo-reset]')
  };

  // ---------------------------------------------------------------- helpers

  function make(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = String(text);
    return node;
  }

  function empty(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function current() {
    return WORKSPACES[state.workspace];
  }

  function visibleRows() {
    var query = state.search.trim().toLowerCase();
    return current().rows.filter(function (row) {
      var matchesFilter = state.filter === 'All' || row.status === state.filter;
      if (!matchesFilter) return false;
      if (!query) return true;
      var haystack = [row.id, row.name, row.sub, row.status, row.owner, row.next]
        .join(' ')
        .toLowerCase();
      return haystack.indexOf(query) !== -1;
    });
  }

  // ---------------------------------------------------------------- render

  function renderMetrics() {
    empty(el.metrics);
    current().metrics.forEach(function (metric) {
      var card = make('article', 'demo-metric');
      card.appendChild(make('span', 'demo-metric__label', metric[0]));
      card.appendChild(make('strong', 'demo-metric__value', metric[1]));
      card.appendChild(make('small', 'demo-metric__note', metric[2]));
      el.metrics.appendChild(card);
    });
  }

  function renderFilters() {
    empty(el.filters);
    current().filters.forEach(function (name) {
      var isActive = name === state.filter;
      var button = make('button', 'demo-filter' + (isActive ? ' is-active' : ''), name);
      button.type = 'button';
      button.setAttribute('aria-pressed', String(isActive));
      button.addEventListener('click', function () {
        state.filter = name;
        state.selected = null;
        renderFilters();
        renderRows();
        renderDetail();
      });
      el.filters.appendChild(button);
    });
  }

  function renderRows() {
    var data = current();
    var rows = visibleRows();

    empty(el.head);
    data.columns.forEach(function (column) {
      var th = make('th', null, column);
      th.scope = 'col';
      el.head.appendChild(th);
    });

    empty(el.body);
    rows.forEach(function (row) {
      var tr = make('tr', row.id === state.selected ? 'is-selected' : null);

      var nameCell = make('td');
      var open = make('button', 'demo-record');
      open.type = 'button';
      open.appendChild(make('strong', null, row.name));
      open.appendChild(make('span', null, row.sub));
      open.addEventListener('click', function () {
        state.selected = row.id;
        renderRows();
        renderDetail();
      });
      nameCell.appendChild(open);
      tr.appendChild(nameCell);

      var statusCell = make('td');
      statusCell.appendChild(make('span', 'demo-status tone-' + row.tone, row.status));
      tr.appendChild(statusCell);

      tr.appendChild(make('td', null, row.owner));
      tr.appendChild(make('td', null, row.next));

      el.body.appendChild(tr);
    });

    el.empty.hidden = rows.length !== 0;
    el.tableWrap.hidden = rows.length === 0;
  }

  function renderDetail(message) {
    empty(el.detail);

    var row = null;
    var all = current().rows;
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === state.selected) { row = all[i]; break; }
    }

    if (!row) {
      var placeholder = make('div', 'demo-detail__placeholder');
      placeholder.appendChild(make('strong', null, 'Select a record'));
      placeholder.appendChild(make('p', null, 'Details and the next useful action appear here.'));
      el.detail.appendChild(placeholder);
      return;
    }

    var topline = make('div', 'demo-detail__topline');
    topline.appendChild(make('span', 'demo-detail__label', 'Sample record'));
    topline.appendChild(make('span', 'demo-status tone-' + row.tone, row.status));
    el.detail.appendChild(topline);

    el.detail.appendChild(make('h4', null, row.name));
    el.detail.appendChild(make('p', 'demo-detail__summary', message || row.summary));

    var list = make('dl', 'demo-detail__list');
    row.details.forEach(function (pair) {
      var group = make('div');
      group.appendChild(make('dt', null, pair[0]));
      group.appendChild(make('dd', null, pair[1]));
      list.appendChild(group);
    });
    el.detail.appendChild(list);

    var action = make('button', 'demo-detail__action', row.action);
    action.type = 'button';
    action.addEventListener('click', function () {
      renderDetail('Demo action complete. In a real build this would follow the approved workflow and permissions.');
    });
    el.detail.appendChild(action);
  }

  function renderWorkspace() {
    var data = current();
    el.kicker.textContent = data.kicker;
    el.title.textContent = data.title;
    el.description.textContent = data.description;
    el.search.value = state.search;

    el.tabs.forEach(function (tab) {
      var isActive = tab.getAttribute('data-demo-tab') === state.workspace;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    });

    renderMetrics();
    renderFilters();
    renderRows();
    renderDetail();
  }

  // ----------------------------------------------------------------- wiring

  el.tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () {
      state.workspace = tab.getAttribute('data-demo-tab');
      state.filter = 'All';
      state.search = '';
      state.selected = null;
      renderWorkspace();
    });

    tab.addEventListener('keydown', function (event) {
      var keys = ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'];
      if (keys.indexOf(event.key) === -1) return;
      event.preventDefault();

      var nextIndex;
      if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = el.tabs.length - 1;
      } else {
        var forward = event.key === 'ArrowDown' || event.key === 'ArrowRight';
        nextIndex = (index + (forward ? 1 : -1) + el.tabs.length) % el.tabs.length;
      }

      state.workspace = el.tabs[nextIndex].getAttribute('data-demo-tab');
      state.filter = 'All';
      state.search = '';
      state.selected = null;
      renderWorkspace();
      el.tabs[nextIndex].focus();
    });
  });

  el.search.addEventListener('input', function (event) {
    state.search = event.target.value;
    state.selected = null;
    renderRows();
    renderDetail();
  });

  el.reset.addEventListener('click', function () {
    state.filter = 'All';
    state.search = '';
    state.selected = null;
    renderWorkspace();
  });

  // The shell ships inert in the page and only becomes interactive here, so
  // the section never advertises controls that cannot work.
  root.removeAttribute('data-demo-idle');
  if (ORDER.indexOf(state.workspace) === -1) state.workspace = ORDER[0];
  renderWorkspace();
})();
