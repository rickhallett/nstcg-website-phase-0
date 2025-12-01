/**
 * Homepage Static JavaScript
 *
 * Simplified version for static archive - loads data from JSON files
 * and updates the DOM directly without complex state management.
 */

(function() {
  'use strict';

  // ===================
  // Configuration
  // ===================

  const ARCHIVE_MODE = true;
  const SHOW_ARCHIVE_NOTICE = true;

  // ===================
  // DOM References
  // ===================

  const elements = {
    counter: document.querySelector('.counter-number'),
    feedContainer: document.querySelector('.live-feed'),
    thoughtBubblesContainer: document.getElementById('thought-bubbles-container'),
    signupForm: document.getElementById('signupForm'),
    surveyModalForm: document.getElementById('surveyModalForm'),
    confirmation: document.getElementById('confirmation'),
    confirmationCount: document.getElementById('confirmation-count')
  };

  // ===================
  // Data Loading
  // ===================

  async function loadData(url, fallback) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load ${url}`);
      return await response.json();
    } catch (error) {
      console.error(`Error loading ${url}:`, error);
      return fallback;
    }
  }

  // ===================
  // Counter Display
  // ===================

  async function updateCounter() {
    const config = await loadData('/data/config/site-config.json', { finalCount: 416 });

    if (elements.counter) {
      // Animate counter
      animateCounter(0, config.finalCount, 2000);
    }

    if (elements.confirmationCount) {
      elements.confirmationCount.textContent = config.finalCount;
    }
  }

  function animateCounter(start, end, duration) {
    const startTime = performance.now();
    const range = end - start;

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out quad
      const easeProgress = 1 - Math.pow(1 - progress, 2);
      const current = Math.floor(start + (range * easeProgress));

      if (elements.counter) {
        elements.counter.textContent = current.toLocaleString();
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  // ===================
  // Live Feed
  // ===================

  async function updateLiveFeed() {
    const data = await loadData('/data/participants/recent-signups.json', []);

    if (!elements.feedContainer) return;

    // Remove loading state
    const loadingEl = elements.feedContainer.querySelector('.feed-loading');
    if (loadingEl) loadingEl.remove();

    // Create feed items
    const feedHTML = data.map(signup => `
      <div class="feed-item animate__animated animate__fadeIn">
        <div class="feed-avatar">${signup.name.charAt(0)}</div>
        <div class="feed-content">
          <div class="feed-name">${signup.name}</div>
          <div class="feed-time">${formatTimestamp(signup.timestamp)}</div>
          ${signup.comment ? `<div class="feed-comment">"${signup.comment}"</div>` : ''}
        </div>
      </div>
    `).join('');

    elements.feedContainer.innerHTML = `
      <div class="feed-header">
        <div class="live-indicator">
          <span class="pulse-dot"></span>
          <span>RECENT COMMUNITY ACTIVITY</span>
        </div>
      </div>
      ${feedHTML}
    `;
  }

  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  // ===================
  // Thought Bubbles
  // ===================

  async function updateThoughtBubbles() {
    const comments = await loadData('/data/participants/comments.json', []);

    if (!elements.thoughtBubblesContainer) return;

    // Take first 15 comments
    const displayComments = comments.slice(0, 15);

    const bubblesHTML = displayComments.map(item => `
      <div class="thought-bubble animate__animated animate__fadeIn">
        <p class="thought-text">"${item.comment}"</p>
        <p class="thought-author">- ${item.name}</p>
      </div>
    `).join('');

    elements.thoughtBubblesContainer.innerHTML = bubblesHTML;
  }

  // ===================
  // Form Handling (Archived)
  // ===================

  function disableForms() {
    if (elements.signupForm) {
      elements.signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showArchivedMessage();
      });
    }

    if (elements.surveyModalForm) {
      elements.surveyModalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showArchivedMessage();
      });
    }
  }

  function showArchivedMessage() {
    alert('This site is archived and no longer accepting new registrations. Thank you for your interest in the North Swanage Traffic Safety campaign.');
  }

  // ===================
  // Archive Notice
  // ===================

  function addArchiveNotice() {
    if (!SHOW_ARCHIVE_NOTICE) return;

    const notice = document.createElement('div');
    notice.className = 'archive-notice';
    notice.style.cssText = `
      background: #2c3e50;
      color: #ecf0f1;
      padding: 10px 20px;
      text-align: center;
      font-size: 14px;
      border-bottom: 2px solid #3498db;
    `;
    notice.innerHTML = `
      <strong>ARCHIVED SITE:</strong> This is a static archive of the campaign website as of December 2025.
      Forms and interactive features are disabled.
    `;

    document.body.insertBefore(notice, document.body.firstChild);
  }

  // ===================
  // Countdown Timer (Archived State)
  // ===================

  function updateCountdownToArchived() {
    const countdownEls = {
      days: document.querySelector('.header-days'),
      hours: document.querySelector('.header-hours'),
      minutes: document.querySelector('.header-minutes'),
      seconds: document.querySelector('.header-seconds')
    };

    // Set to zeros or "ENDED"
    if (countdownEls.days) countdownEls.days.textContent = '00';
    if (countdownEls.hours) countdownEls.hours.textContent = '00';
    if (countdownEls.minutes) countdownEls.minutes.textContent = '00';
    if (countdownEls.seconds) countdownEls.seconds.textContent = '00';

    // Optionally add "CAMPAIGN ENDED" badge
    const alertBadge = document.querySelector('.alert-badge');
    if (alertBadge) {
      alertBadge.innerHTML = '<span>CAMPAIGN ENDED</span>';
      alertBadge.style.background = '#95a5a6';
    }
  }

  // ===================
  // Navigation
  // ===================

  function setupNavigation() {
    // Simple navigation setup - just ensure links work
    const navLinks = document.querySelectorAll('a[href^="/"]');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.includes('.html')) {
        link.setAttribute('href', href + '.html');
      }
    });
  }

  // ===================
  // Initialization
  // ===================

  async function init() {
    console.log('NSTCG Static Archive - Homepage initialized');

    // Add archive notice
    addArchiveNotice();

    // Load and display data
    await updateCounter();
    await updateLiveFeed();
    await updateThoughtBubbles();

    // Setup archived state
    updateCountdownToArchived();
    disableForms();
    setupNavigation();

    console.log('Homepage ready');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
