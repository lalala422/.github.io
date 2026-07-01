(function () {
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();

  async function fetchLatestCommitDate(branch) {
    const apiUrl =
      'https://api.github.com/repos/lalala422/zuoye/commits' +
      '?sha=' + encodeURIComponent(branch) +
      '&per_page=1&cache_bust=' + Date.now();

    const response = await fetch(apiUrl, {
      cache: 'no-store',
      headers: { Accept: 'application/vnd.github+json' }
    });

    if (!response.ok) throw new Error('GitHub API request failed on ' + branch);
    const commits = await response.json();
    const dateText =
      commits?.[0]?.commit?.committer?.date ||
      commits?.[0]?.commit?.author?.date;
    if (!dateText) throw new Error('No commit date found on ' + branch);
    return new Date(dateText);
  }

  async function loadLastUpdatedDate() {
    const lastUpdated = document.querySelector('#last-updated');
    if (!lastUpdated) return;

    try {
      let date;
      try {
        date = await fetchLatestCommitDate('main');
      } catch (mainError) {
        date = await fetchLatestCommitDate('master');
      }

      lastUpdated.textContent = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch (error) {
      lastUpdated.textContent = 'Recently';
      console.warn('Could not load last updated date:', error);
    }
  }

  loadLastUpdatedDate();

  // Count only visits to index.html, and only once per browser tab session.
  // The counter image is deliberately placed only on Home. It is not loaded on
  // Research/Publications/People/Contact pages, and it is not loaded again when
  // returning to Home in the same tab session.
  const indexCounter = document.querySelector('#index-page-counter');
  if (indexCounter) {
    const sessionKey = 'zuoye-index-view-counted-v1';
    const badgeUrl = 'https://visitor-badge.laobi.icu/badge?page_id=lalala422.zuoye.index&left_text=Index%20views&right_color=%232563eb&left_color=%23f1f5f9&format=true';

    if (!sessionStorage.getItem(sessionKey)) {
      const img = document.createElement('img');
      img.className = 'visitor-badge';
      img.alt = 'Index page view counter';
      img.src = badgeUrl + '&cache_bust=' + Date.now();
      indexCounter.replaceChildren(img);
      sessionStorage.setItem(sessionKey, '1');
    } else {
      const span = document.createElement('span');
      span.className = 'counter-note';
      span.textContent = 'Index view counted once this session';
      indexCounter.replaceChildren(span);
    }
  }
})();