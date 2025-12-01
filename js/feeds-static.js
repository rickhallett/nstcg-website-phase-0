/**
 * Feeds Page Static JavaScript
 *
 * Displays all participants in the archived static site
 */

(function() {
  'use strict';

  // ===================
  // Configuration
  // ===================

  const ITEMS_PER_PAGE = 50;
  let currentPage = 1;
  let allParticipants = [];

  // ===================
  // Data Loading
  // ===================

  async function loadParticipants() {
    try {
      const response = await fetch('/data/participants/all-participants.json');
      if (!response.ok) throw new Error('Failed to load participants');
      allParticipants = await response.json();
      return allParticipants;
    } catch (error) {
      console.error('Error loading participants:', error);
      return [];
    }
  }

  // ===================
  // Display Functions
  // ===================

  function displayParticipants(participants, page = 1) {
    const container = document.getElementById('participants-container');
    if (!container) return;

    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageParticipants = participants.slice(start, end);

    const html = pageParticipants.map((p, index) => {
      const fullName = p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Anonymous';
      const nameParts = fullName.split(' ');
      let displayName = nameParts[0];

      if (nameParts.length > 1) {
        const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
        displayName = `${nameParts[0]} ${lastInitial}.`;
      }

      return `
        <div class="participant-card animate__animated animate__fadeIn" style="animation-delay: ${index * 0.02}s">
          <div class="participant-avatar">${displayName.charAt(0)}</div>
          <div class="participant-info">
            <div class="participant-name">${displayName}</div>
            <div class="participant-meta">${formatDate(p.timestamp)}</div>
            ${p.comments ? `<div class="participant-comment">"${p.comments}"</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html || '<p>No participants found.</p>';

    // Update pagination
    updatePagination(participants.length, page);
  }

  function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  function updatePagination(total, currentPage) {
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    const paginationContainer = document.getElementById('pagination');

    if (!paginationContainer || totalPages <= 1) {
      if (paginationContainer) paginationContainer.innerHTML = '';
      return;
    }

    let html = '<div class="pagination-buttons">';

    // Previous button
    if (currentPage > 1) {
      html += `<button class="pagination-btn" data-page="${currentPage - 1}">Previous</button>`;
    }

    // Page numbers (show current, +/- 2)
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      const activeClass = i === currentPage ? 'active' : '';
      html += `<button class="pagination-btn ${activeClass}" data-page="${i}">${i}</button>`;
    }

    // Next button
    if (currentPage < totalPages) {
      html += `<button class="pagination-btn" data-page="${currentPage + 1}">Next</button>`;
    }

    html += '</div>';
    paginationContainer.innerHTML = html;

    // Add click handlers
    document.querySelectorAll('.pagination-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const page = parseInt(e.target.dataset.page);
        if (page) {
          currentPage = page;
          displayParticipants(allParticipants, page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });
  }

  // ===================
  // Stats Display
  // ===================

  async function displayStats() {
    try {
      const response = await fetch('/data/config/site-config.json');
      const config = await response.json();

      const statsContainer = document.getElementById('stats-container');
      if (statsContainer) {
        statsContainer.innerHTML = `
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${config.finalCount}</div>
              <div class="stat-label">Total Participants</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${config.publishedCount}</div>
              <div class="stat-label">Published</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">Archived</div>
              <div class="stat-label">Campaign Status</div>
            </div>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
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
      padding: 10px 20px;
      text-align: center;
      font-size: 14px;
      border-bottom: 2px solid #3498db;
    `;
    notice.innerHTML = `
      <strong>ARCHIVED SITE:</strong> This is a static archive showing all ${allParticipants.length} campaign participants.
    `;

    document.body.insertBefore(notice, document.body.firstChild);
  }

  // ===================
  // Initialization
  // ===================

  async function init() {
    console.log('NSTCG Static Archive - Feeds page initialized');

    // Load participants
    await loadParticipants();

    // Display content
    displayParticipants(allParticipants, 1);
    await displayStats();
    addArchiveNotice();

    console.log(`Loaded ${allParticipants.length} participants`);
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
