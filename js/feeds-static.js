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
    const container = document.getElementById('feeds-grid');
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

      // Update individual stat elements
      const totalCount = document.getElementById('total-count');
      const todayCount = document.getElementById('today-count');
      const weekCount = document.getElementById('week-count');
      const feedsCount = document.getElementById('feeds-count');

      if (totalCount) {
        totalCount.innerHTML = config.finalCount || allParticipants.length;
      }

      if (todayCount) {
        todayCount.innerHTML = config.todayCount || 0;
      }

      if (weekCount) {
        weekCount.innerHTML = config.weekCount || 0;
      }

      if (feedsCount) {
        const countSpan = feedsCount.querySelector('span');
        if (countSpan) {
          countSpan.textContent = allParticipants.length;
        }
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
  // Chart Display
  // ===================

  function createSignupChart() {
    const chartCanvas = document.getElementById('signup-chart');
    const graphLoading = document.getElementById('graph-loading');

    if (!chartCanvas || !allParticipants.length) return;

    // Campaign end date (June 30th, 2025)
    const campaignEndDate = new Date('2025-06-30T23:59:59.999Z');

    // Filter participants within campaign period and sort by date
    const campaignParticipants = allParticipants
      .filter(p => new Date(p.timestamp) <= campaignEndDate)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (!campaignParticipants.length) return;

    // Find the campaign start date (first signup)
    const startDate = new Date(campaignParticipants[0].timestamp);
    startDate.setHours(0, 0, 0, 0);

    // Group signups by date
    const signupsByDate = {};
    campaignParticipants.forEach(p => {
      const date = new Date(p.timestamp).toISOString().split('T')[0];
      signupsByDate[date] = (signupsByDate[date] || 0) + 1;
    });

    // Create all dates from start to campaign end
    const dates = [];
    const currentDate = new Date(startDate);
    while (currentDate <= campaignEndDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Build chart data starting from 0
    const labels = [];
    const data = [];
    let cumulative = 0;

    // Add day 0 starting point
    labels.push(startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }));
    data.push(0);

    // Add cumulative data for each day
    dates.forEach(date => {
      if (signupsByDate[date]) {
        cumulative += signupsByDate[date];
      }
      const d = new Date(date);
      const label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      labels.push(label);
      data.push(cumulative);
    });

    // Sample data if too many points (show every nth point, but always keep first and last)
    const maxPoints = 60;
    let sampledLabels = labels;
    let sampledData = data;

    if (labels.length > maxPoints) {
      const step = Math.ceil(labels.length / maxPoints);
      sampledLabels = [labels[0]]; // Always include first point (day 0)
      sampledData = [data[0]];

      for (let i = step; i < labels.length - 1; i += step) {
        sampledLabels.push(labels[i]);
        sampledData.push(data[i]);
      }

      // Always include last point
      sampledLabels.push(labels[labels.length - 1]);
      sampledData.push(data[data.length - 1]);
    }

    // Hide loading spinner
    if (graphLoading) {
      graphLoading.style.display = 'none';
    }

    // Create chart
    new Chart(chartCanvas, {
      type: 'line',
      data: {
        labels: sampledLabels,
        datasets: [{
          label: 'Campaign Participants',
          data: sampledData,
          borderColor: '#ff6600',
          backgroundColor: 'rgba(255, 102, 0, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#ff6600',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 12,
            displayColors: false,
            callbacks: {
              label: function(context) {
                return `Participants: ${context.parsed.y}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#ecf0f1',
              maxRotation: 45,
              minRotation: 45
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#ecf0f1',
              precision: 0
            }
          }
        }
      }
    });
  }

  // ===================
  // Display Hot Topics (Static)
  // ===================

  function displayHotTopics() {
    // Hide hot topics loading spinner
    const hotTopicsLoading = document.getElementById('hot-topics-loading');
    if (hotTopicsLoading) {
      hotTopicsLoading.style.display = 'none';
    }

    // Static hot topics based on community feedback analysis
    const hotTopics = [
      {
        title: 'Worries of Pedestrian Safety on Northbrook & De Moulam Roads',
        count: 87,
        percentage: 21,
        icon: 'fa-person-walking',
        sentiment: 'critical'
      },
      {
        title: 'School Safety and Children at Risk',
        count: 64,
        percentage: 15,
        icon: 'fa-school',
        sentiment: 'critical'
      },
      {
        title: 'Increased Traffic Congestion',
        count: 112,
        percentage: 27,
        icon: 'fa-traffic-light',
        sentiment: 'high'
      },
      {
        title: 'Parking Problems and Residential Access',
        count: 58,
        percentage: 14,
        icon: 'fa-square-parking',
        sentiment: 'high'
      },
      {
        title: 'Shore Road Closure Impact',
        count: 95,
        percentage: 23,
        icon: 'fa-road-barrier',
        sentiment: 'high'
      }
    ];

    const hotTopicsContainer = document.getElementById('hot-topics-container');
    if (hotTopicsContainer) {
      const html = hotTopics.map(topic => `
        <div class="hot-topic-card ${topic.sentiment}">
          <div class="hot-topic-icon">
            <i class="fas ${topic.icon}"></i>
          </div>
          <div class="hot-topic-content">
            <h3 class="hot-topic-title">${topic.title}</h3>
            <div class="hot-topic-stats">
              <span class="hot-topic-count">${topic.count} mentions</span>
              <span class="hot-topic-percentage">${topic.percentage}%</span>
            </div>
            <div class="hot-topic-bar">
              <div class="hot-topic-fill" style="width: ${topic.percentage}%"></div>
            </div>
          </div>
        </div>
      `).join('');

      hotTopicsContainer.innerHTML = html;
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

  async function init() {
    console.log('NSTCG Static Archive - Feeds page initialized');

    // Setup navigation
    setupNavigation();

    // Load participants
    await loadParticipants();

    // Display content
    displayParticipants(allParticipants, 1);
    await displayStats();
    createSignupChart();
    displayHotTopics();
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
