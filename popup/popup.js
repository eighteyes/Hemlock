/**
 * popup.js — Popup logic for stats and blocklist management
 * Responsibilities:
 *   - Render stats view with per-entry hit counts
 *   - Render blocklist view with collapsible buckets, toggles, add/delete
 *   - Handle import/export JSON, reset to defaults
 *   - Notify content scripts to re-filter on changes
 */

(() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const tabStats = $('#tab-stats');
  const tabBlocklist = $('#tab-blocklist');
  const tabAdd = $('#tab-add');
  const viewStats = $('#view-stats');
  const viewBlocklist = $('#view-blocklist');
  const viewAdd = $('#view-add');
  const tabs = [tabStats, tabBlocklist, tabAdd];
  const views = { stats: viewStats, blocklist: viewBlocklist, add: viewAdd };

  tabStats.addEventListener('click', () => switchTab('stats'));
  tabBlocklist.addEventListener('click', () => switchTab('blocklist'));
  tabAdd.addEventListener('click', () => switchTab('add'));

  function switchTab(name) {
    for (const t of tabs) t.classList.remove('active');
    for (const v of Object.values(views)) v.hidden = true;
    views[name].hidden = false;
    ({ stats: tabStats, blocklist: tabBlocklist, add: tabAdd })[name].classList.add('active');
    if (name === 'stats') renderStats();
    else if (name === 'blocklist') renderBlocklist();
    else if (name === 'add') renderAddPanel();
  }

  async function renderStats() {
    const { byBucket, pageTotal, days } = await Storage.getAggregatedStats();
    const summary = $('#stats-summary');
    const list = $('#stats-entries');
    summary.textContent = `${pageTotal} items filtered (${days} day${days !== 1 ? 's' : ''})`;
    list.textContent = '';

    if (byBucket.length === 0) {
      summary.textContent = 'No filtering activity yet.';
      return;
    }

    const sorted = byBucket.sort((a, b) => b.total - a.total);
    for (const bucket of sorted) {
      const li = document.createElement('li');
      li.className = 'stats-bucket';

      const header = document.createElement('div');
      header.className = 'stats-bucket-header';

      const arrow = document.createElement('span');
      arrow.className = 'arrow';
      arrow.textContent = '\u25B6';

      const nameSpan = document.createElement('span');
      nameSpan.textContent = bucket.name;

      const countSpan = document.createElement('span');
      countSpan.className = 'count';
      countSpan.textContent = bucket.total;

      header.append(arrow, nameSpan, countSpan);

      const detail = document.createElement('ul');
      detail.className = 'stats-detail collapsed';

      const entries = Object.entries(bucket.entries).sort((a, b) => b[1] - a[1]);
      for (const [name, count] of entries) {
        const entryLi = document.createElement('li');
        const entryName = document.createElement('span');
        entryName.textContent = name;
        const entryCount = document.createElement('span');
        entryCount.className = 'count';
        entryCount.textContent = count;
        entryLi.append(entryName, entryCount);
        detail.appendChild(entryLi);
      }

      header.addEventListener('click', () => {
        detail.classList.toggle('collapsed');
        arrow.classList.toggle('open');
      });

      li.append(header, detail);
      list.appendChild(li);
    }
  }

  async function renderBlocklist() {
    const buckets = await Storage.load();
    const container = $('#bucket-list');
    container.textContent = '';

    for (let bi = 0; bi < buckets.length; bi++) {
      const bucket = buckets[bi];
      const div = document.createElement('div');
      div.className = 'bucket';

      const header = document.createElement('div');
      header.className = 'bucket-header';

      const arrow = document.createElement('span');
      arrow.className = 'arrow';
      arrow.textContent = '\u25B6';

      const toggle = document.createElement('input');
      toggle.type = 'checkbox';
      toggle.checked = bucket.enabled;
      toggle.addEventListener('change', () => {
        bucket.enabled = toggle.checked;
        for (const entry of bucket.entries) {
          entry.enabled = toggle.checked;
        }
        saveBuckets(buckets);
        renderBlocklist();
      });

      const name = document.createElement('span');
      name.className = 'bucket-name';
      name.textContent = bucket.name;

      const count = document.createElement('span');
      count.className = 'bucket-count';
      count.textContent = `${bucket.entries.length}`;

      header.append(arrow, toggle, name, count);

      const entries = document.createElement('ul');
      entries.className = 'bucket-entries collapsed';

      header.addEventListener('click', (e) => {
        if (e.target === toggle) return;
        entries.classList.toggle('collapsed');
        arrow.classList.toggle('open');
      });

      for (let ei = 0; ei < bucket.entries.length; ei++) {
        const entry = bucket.entries[ei];
        const li = document.createElement('li');
        li.className = 'bucket-entry';

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = entry.enabled;
        cb.addEventListener('change', () => {
          entry.enabled = cb.checked;
          saveBuckets(buckets);
        });

        const label = document.createElement('label');
        label.textContent = entry.name;

        const del = document.createElement('button');
        del.className = 'entry-delete';
        del.textContent = '\u00D7';
        del.addEventListener('click', () => {
          bucket.entries.splice(ei, 1);
          saveBuckets(buckets);
          renderBlocklist();
        });

        li.append(cb, label, del);
        entries.appendChild(li);
      }

      div.append(header, entries);
      container.appendChild(div);
    }
  }

  async function renderAddPanel() {
    const buckets = await Storage.load();
    const select = $('#add-bucket-select');
    const input = $('#add-name-input');
    const feedback = $('#add-feedback');
    select.textContent = '';
    feedback.textContent = '';

    for (const bucket of buckets) {
      const opt = document.createElement('option');
      opt.value = bucket.id;
      opt.textContent = bucket.name;
      select.appendChild(opt);
    }

    input.value = '';
    input.focus();
  }

  async function doAddEntry() {
    const buckets = await Storage.load();
    const select = $('#add-bucket-select');
    const input = $('#add-name-input');
    const feedback = $('#add-feedback');
    const name = input.value.trim();

    if (!name) return;
    if (!Sanitize.isValidName(name)) {
      feedback.textContent = 'Invalid name';
      feedback.className = 'add-feedback error';
      return;
    }

    const bucket = buckets.find(b => b.id === select.value);
    if (!bucket) return;

    const exists = bucket.entries.some(e => e.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      feedback.textContent = 'Already blocked';
      feedback.className = 'add-feedback error';
      return;
    }

    bucket.entries.push({ name, enabled: true });
    await saveBuckets(buckets);
    feedback.textContent = `"${name}" added to ${bucket.name}`;
    feedback.className = 'add-feedback success';
    input.value = '';
    input.focus();
  }

  $('#btn-add-entry').addEventListener('click', doAddEntry);
  $('#add-name-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doAddEntry();
  });

  async function saveBuckets(buckets) {
    await Storage.save(buckets);
    notifyRefilter();
  }

  function notifyRefilter() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'refilter' });
      }
    });
  }

  // Add bucket
  $('#btn-add-bucket').addEventListener('click', async () => {
    const name = prompt('Bucket name:');
    if (!name || !name.trim()) return;
    const buckets = await Storage.load();
    const id = name.trim().toLowerCase().replace(/\s+/g, '-');
    if (buckets.some(b => b.id === id)) return;
    buckets.push({ id, name: name.trim(), enabled: true, preset: false, entries: [] });
    await saveBuckets(buckets);
    renderAddPanel();
    const select = $('#add-bucket-select');
    select.value = id;
  });

  // Import
  $('#btn-import').addEventListener('click', () => $('#file-import').click());
  $('#file-import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('Expected array');
      for (const b of data) {
        if (!b.id || !b.name || !Array.isArray(b.entries)) throw new Error('Invalid bucket');
        for (const entry of b.entries) {
          if (!Sanitize.isValidName(entry.name)) throw new Error(`Invalid name: ${entry.name}`);
        }
      }
      await saveBuckets(data);
      renderBlocklist();
    } catch (err) {
      console.error('Import failed:', err);
    }
  });

  // Export
  $('#btn-export').addEventListener('click', async () => {
    const buckets = await Storage.load();
    const blob = new Blob([JSON.stringify(buckets, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hemlock-blocklist.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  // Reset
  $('#btn-reset').addEventListener('click', () => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-dialog">
        <p>Reset all buckets to defaults?<br>Custom entries will be lost.</p>
        <div class="confirm-actions">
          <button class="btn-cancel">Cancel</button>
          <button class="btn-confirm">Reset</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('.btn-cancel').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('.btn-confirm').addEventListener('click', async () => {
      overlay.remove();
      const defaults = Defaults.getDefaults();
      await saveBuckets(defaults);
      renderBlocklist();
    });
  });

  // Init
  renderStats();
})();
