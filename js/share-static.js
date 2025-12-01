/**
 * Share Page Static JavaScript
 *
 * Share page for archived site - displays info but disables tracking
 */

(function() {
  'use strict';

  // Only run on share page (check for unique share element)
  if (!document.querySelector('.share-dashboard')) {
    return;
  }

  // ===================
  // Archive Notice
  // ===================

  function addArchiveNotice() {
    const notice = document.createElement('div');
    notice.className = 'archive-notice';
    notice.style.cssText = `
      background: #2c3e50;
      color: #ecf0f1;
      padding: 15px 20px;
      text-align: center;
      font-size: 14px;
      border-bottom: 2px solid #3498db;
      margin-bottom: 20px;
    `;
    notice.innerHTML = `
      <strong>ARCHIVED SITE:</strong> Social sharing features are disabled in this archive.
      This page is preserved for historical reference only.
    `;

    const mainContent = document.getElementById('main-content') || document.body;
    mainContent.insertBefore(notice, mainContent.firstChild);
  }

  // ===================
  // Disable Share Tracking
  // ===================

  function disableShareButtons() {
    const shareButtons = document.querySelectorAll('[data-share-platform], .share-btn');

    shareButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Social sharing is disabled in this archived version of the site.');
      });

      // Visual indication that buttons are disabled
      btn.style.opacity = '0.6';
      btn.style.cursor = 'not-allowed';
    });
  }

  // ===================
  // Display Campaign Stats
  // ===================

  async function displayStats() {
    try {
      const response = await fetch('/data/config/site-config.json');
      const config = await response.json();

      const statsContainer = document.getElementById('campaign-stats');
      if (statsContainer) {
        statsContainer.innerHTML = `
          <div class="stats-summary">
            <h3>Campaign Results</h3>
            <div class="stat-row">
              <span class="stat-label">Total Participants:</span>
              <span class="stat-value">${config.finalCount}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Campaign Status:</span>
              <span class="stat-value">Archived</span>
            </div>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  // ===================
  // Navigation
  // ===================

  function setupNavigation() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
    const body = document.body;

    if (!mobileMenuToggle) return;

    // Toggle mobile menu
    function toggleMobileMenu() {
      const isOpen = body.classList.contains('mobile-menu-open');

      if (isOpen) {
        body.classList.remove('mobile-menu-open');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
      } else {
        body.classList.add('mobile-menu-open');
        mobileMenuToggle.setAttribute('aria-expanded', 'true');
      }
    }

    // Event listeners
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);

    if (mobileMenuOverlay) {
      mobileMenuOverlay.addEventListener('click', toggleMobileMenu);
    }

    // Close menu on navigation
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu a');
    mobileMenuLinks.forEach(link => {
      link.addEventListener('click', () => {
        body.classList.remove('mobile-menu-open');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && body.classList.contains('mobile-menu-open')) {
        toggleMobileMenu();
      }
    });

    // Active page highlighting
    const currentPage = window.location.pathname;
    document.querySelectorAll('.nav-menu a').forEach(link => {
      const linkPath = new URL(link.href).pathname;
      if (linkPath === currentPage) {
        link.classList.add('active');
      }
    });
  }

  // ===================
  // Initialization
  // ===================

  function init() {
    console.log('NSTCG Static Archive - Share page initialized');

    setupNavigation();
    addArchiveNotice();
    disableShareButtons();
    displayStats();

    console.log('Share page ready (archived mode)');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
