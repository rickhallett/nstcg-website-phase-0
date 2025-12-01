/**
 * Homepage Static JavaScript
 *
 * Simplified version for static archive - loads data from JSON files
 * and updates the DOM directly without complex state management.
 */

(function () {
  "use strict";

  // Only run on homepage (check for unique homepage element)
  if (!document.getElementById("thought-bubbles-container")) {
    return;
  }

  // ===================
  // Configuration
  // ===================

  const ARCHIVE_MODE = true;
  const SHOW_ARCHIVE_NOTICE = true;

  // ===================
  // DOM References
  // ===================

  const elements = {
    counter: document.querySelector(".counter-number"),
    feedContainer: document.querySelector(".live-feed"),
    thoughtBubblesContainer: document.getElementById(
      "thought-bubbles-container"
    ),
    signupForm: document.getElementById("signupForm"),
    surveyModalForm: document.getElementById("surveyModalForm"),
    confirmation: document.getElementById("confirmation"),
    confirmationCount: document.getElementById("confirmation-count"),
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
    const config = await loadData("/data/config/site-config.json", {
      finalCount: 416,
    });

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
      const current = Math.floor(start + range * easeProgress);

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
    const data = await loadData("/data/participants/recent-signups.json", []);
    const config = await loadData("/data/config/site-config.json", {
      finalCount: 416,
    });

    if (!elements.feedContainer) return;

    // Remove loading state
    const loadingEl = elements.feedContainer.querySelector(".feed-loading");
    if (loadingEl) loadingEl.remove();

    // Create feed items with submission numbers
    const totalParticipants = config.finalCount || 416;
    const feedHTML = data
      .map((signup, index) => {
        const submissionNumber = totalParticipants - index;
        return `
      <div class="feed-item animate__animated animate__fadeIn">
        <div class="feed-avatar">#${submissionNumber}</div>
        <div class="feed-content">
          <div class="feed-name">${signup.name}</div>
          <div class="feed-time">${formatTimestamp(signup.timestamp)}</div>
          ${
            signup.comment
              ? `<div class="feed-comment">"${signup.comment}"</div>`
              : ""
          }
        </div>
      </div>
    `;
      })
      .join("");

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

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  }

  // ===================
  // Thought Bubbles
  // ===================

  async function updateThoughtBubbles() {
    const comments = await loadData("/data/participants/comments.json", []);

    if (!elements.thoughtBubblesContainer) return;

    // Take first 15 comments
    const displayComments = comments.slice(0, 15);

    const bubblesHTML = displayComments
      .map(
        (item) => `
      <div class="thought-bubble animate__animated animate__fadeIn">
        <p class="thought-text">"${item.comment}"</p>
        <p class="thought-author">- ${item.name}</p>
      </div>
    `
      )
      .join("");

    elements.thoughtBubblesContainer.innerHTML = bubblesHTML;
  }

  // ===================
  // Form Handling (Archived)
  // ===================

  function disableForms() {
    if (elements.signupForm) {
      elements.signupForm.addEventListener("submit", (e) => {
        e.preventDefault();
        showArchivedMessage();
      });
    }

    if (elements.surveyModalForm) {
      elements.surveyModalForm.addEventListener("submit", (e) => {
        e.preventDefault();
        showModalConfirmation();
      });
    }
  }

  function showArchivedMessage() {
    alert(
      "This site is archived and no longer accepting new registrations. Thank you for your interest in the North Swanage Traffic Safety campaign."
    );
  }

  // ===================
  // Modal Confirmation & Survey Flow
  // ===================

  function showModalConfirmation() {
    const modalContent = document.getElementById("modal-survey-content");
    if (!modalContent) return;

    modalContent.innerHTML = `
      <div style="padding: 20px;">
        <div style="background: rgba(0, 255, 0, 0.1); border: 2px solid #00ff00; border-radius: 8px; padding: 30px; text-align: center; margin-bottom: 20px;">
          <div style="font-size: 40px; margin-bottom: 15px;">✓ <span style="color: #00ff00; font-weight: bold; font-size: 28px;">WELCOME TO THE MOVEMENT!</span></div>
          <p style="color: #fff; font-size: 18px; margin-bottom: 10px;">
            You are now part of <span style="color: #00ff00; font-weight: bold;">416 Neighbours</span> fighting for safer streets.
          </p>
          <p style="color: #00ff00; font-size: 16px; font-weight: bold;">
            Check your email for next steps and community updates.
          </p>
          <button onclick="window.showModalSurveyInstructions()" style="
            width: 100%;
            margin-top: 20px;
            background: #00ff00;
            color: #1a1a1a;
            padding: 18px 30px;
            border: none;
            border-radius: 5px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            text-transform: uppercase;
            transition: all 0.3s ease;
          " onmouseover="this.style.background='#00cc00'" onmouseout="this.style.background='#00ff00'">
            CONTINUE TO OFFICIAL SURVEY →
          </button>
        </div>

        <p style="color: #999; text-align: center; font-size: 12px;">
          Archived demonstration - Survey has ended
        </p>
      </div>
    `;
  }

  function showModalSurveyInstructions() {
    const modalContent = document.getElementById("modal-survey-content");
    if (!modalContent) return;

    modalContent.innerHTML = `
      <div style="padding: 10px;">
        <div style="background: rgba(0, 255, 0, 0.05); border: 2px solid #00ff00; border-radius: 8px; padding: 20px;">
          <h4 style="color: #00ff00; margin-bottom: 15px; font-size: 19px; text-align: center; font-weight: bold;">
            Dorset Coast Forum Public Engagement Survey
          </h4>

          <div style="background: rgba(50, 50, 50, 0.5); padding: 15px; border-radius: 5px; margin-bottom: 15px;">
            <p style="color: #ccc; margin-bottom: 12px; line-height: 1.4; font-size: 14px;">
              The Dorset Coast Forum has launched a public engagement survey to gather community input on the Shore Road improvements. The survey contains approximately 30 questions covering various aspects including green spaces, pedestrian safety, and traffic management.
            </p>

            <p style="color: #ccc; margin-bottom: 12px; line-height: 1.4; font-size: 14px;">
              If your primary concern is traffic safety, the most relevant questions are:
            </p>

            <div style="margin-bottom: 10px;">
              <span style="color: #00ff00; font-weight: bold;">STEP 1:</span>
              <span style="color: #fff;"> Answer Question 1 (Your connection to the area)</span>
            </div>

            <div style="margin-bottom: 10px;">
              <span style="color: #00ff00; font-weight: bold;">STEP 2:</span>
              <span style="color: #fff;"> Skip directly to Question 24 - Select "Don't Know"</span>
            </div>

            <div style="margin-bottom: 12px;">
              <span style="color: #00ff00; font-weight: bold;">STEP 3:</span>
              <span style="color: #fff;"> Go to Question 26 - Rank preferences in this order:</span>
            </div>

            <div style="background: rgba(0, 100, 0, 0.2); border-left: 4px solid #00ff00; padding: 12px; margin-left: 20px; margin-bottom: 12px;">
              <div style="margin-bottom: 8px;">
                <span style="color: #fff; font-weight: bold;">1st Choice:</span>
                <span style="color: #00ff00;"> Two-way traffic on Shore Road with removal of parking</span>
              </div>
              <div style="margin-bottom: 8px;">
                <span style="color: #fff; font-weight: bold;">2nd Choice:</span>
                <span style="color: #ccc;"> Do nothing / keep Shore Road as it is</span>
              </div>
              <div style="margin-bottom: 8px;">
                <span style="color: #fff; font-weight: bold;">3rd Choice:</span>
                <span style="color: #ccc;"> A one-way system on Shore Road - would </span>
                <span style="color: #FFA500; font-weight: bold;">redirect significant</span>
                <span style="color: #ccc;"> traffic</span>
              </div>
              <div>
                <span style="color: #fff; font-weight: bold;">4th Choice:</span>
                <span style="color: #ccc;"> Full closure of Shore Road - would redirect </span>
                <span style="color: #ff0000; font-weight: bold;">traffic to residential streets</span>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding: 8px; background: rgba(100, 100, 100, 0.3); border-radius: 5px;">
              <span style="font-size: 18px;">⏱️</span>
              <span style="color: #ccc; font-size: 13px;">This takes only 30 seconds vs 30 minutes for the full survey</span>
            </div>

            <div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: rgba(0, 255, 0, 0.1); border-radius: 5px;">
              <span style="font-size: 18px;">✅</span>
              <span style="color: #fff; font-size: 13px; font-weight: bold;">These 3 questions constitute a COMPLETE and VALID survey response</span>
            </div>
          </div>

          <div style="margin-bottom: 10px;">
            <label style="display: flex; align-items: center; cursor: pointer; color: #fff;">
              <input type="checkbox" id="modal-understand-checkbox" style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
              <span style="font-size: 14px;">I understand the survey structure and am ready to proceed</span>
            </label>
          </div>

          <div style="margin-bottom: 15px;">
            <label style="display: flex; align-items: center; cursor: pointer; color: #fff;">
              <input type="checkbox" id="modal-valid-survey-checkbox" style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
              <span style="font-size: 14px;">I understand that questions 1, 24, and 26 do constitute a valid and complete survey</span>
            </label>
          </div>

          <button id="modal-official-survey-btn" class="official-survey-btn" disabled style="
            width: 100%;
            background: #666;
            color: #999;
            padding: 18px;
            border: none;
            border-radius: 5px;
            font-size: 18px;
            font-weight: bold;
            cursor: not-allowed;
            text-transform: uppercase;
            transition: all 0.3s ease;
          ">
            OPEN OFFICIAL SURVEY →
          </button>
        </div>

        <p style="color: #666; text-align: center; margin-top: 10px; font-size: 11px;">
          Screenshot reference - recreated from git commit 542037b (July 2025)
        </p>
      </div>
    `;

    // Add event listeners for checkboxes
    const understandCheckbox = document.getElementById(
      "modal-understand-checkbox"
    );
    const validCheckbox = document.getElementById(
      "modal-valid-survey-checkbox"
    );
    const officialSurveyBtn = document.getElementById(
      "modal-official-survey-btn"
    );

    if (understandCheckbox) {
      understandCheckbox.addEventListener("change", toggleModalSurveyButton);
    }

    if (validCheckbox) {
      validCheckbox.addEventListener("change", toggleModalSurveyButton);
    }

    function toggleModalSurveyButton() {
      if (understandCheckbox && validCheckbox && officialSurveyBtn) {
        if (understandCheckbox.checked && validCheckbox.checked) {
          officialSurveyBtn.style.background = "#666";
          officialSurveyBtn.style.color = "#fff";
        } else {
          officialSurveyBtn.style.background = "#666";
          officialSurveyBtn.style.color = "#999";
        }
      }
    }
  }

  // Expose functions globally
  window.showModalSurveyInstructions = showModalSurveyInstructions;

  // ===================
  // Archive Notice
  // ===================

  function addArchiveNotice() {
    if (!SHOW_ARCHIVE_NOTICE) return;

    const notice = document.createElement("div");
    notice.className = "archive-notice";
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
    const countdownContainer = document.querySelector(".header-countdown");

    if (countdownContainer) {
      // Replace countdown with "Survey Closed" message
      countdownContainer.innerHTML =
        '<span style="color: #ff6b6b; font-weight: bold; text-shadow: 0 0 10px #ff6b6b; font-size: 18px;">Survey Closed</span>';
    }

    // Update alert badge
    const alertBadge = document.querySelector(".alert-badge");
    if (alertBadge) {
      alertBadge.innerHTML = "<span>CAMPAIGN ENDED</span>";
      alertBadge.style.background = "#95a5a6";
    }
  }

  // ===================
  // Navigation
  // ===================

  function setupNavigation() {
    const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
    const mobileMenuOverlay = document.querySelector(".mobile-menu-overlay");
    const body = document.body;

    if (!mobileMenuToggle) return;

    // Toggle mobile menu
    function toggleMobileMenu() {
      const isOpen = body.classList.contains("mobile-menu-open");

      if (isOpen) {
        body.classList.remove("mobile-menu-open");
        mobileMenuToggle.setAttribute("aria-expanded", "false");
      } else {
        body.classList.add("mobile-menu-open");
        mobileMenuToggle.setAttribute("aria-expanded", "true");
      }
    }

    // Event listeners
    mobileMenuToggle.addEventListener("click", toggleMobileMenu);

    if (mobileMenuOverlay) {
      mobileMenuOverlay.addEventListener("click", toggleMobileMenu);
    }

    // Close menu on navigation
    const mobileMenuLinks = document.querySelectorAll(".mobile-menu a");
    mobileMenuLinks.forEach((link) => {
      link.addEventListener("click", () => {
        body.classList.remove("mobile-menu-open");
        mobileMenuToggle.setAttribute("aria-expanded", "false");
      });
    });

    // Close menu on escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && body.classList.contains("mobile-menu-open")) {
        toggleMobileMenu();
      }
    });

    // Active page highlighting
    const currentPage = window.location.pathname;
    document.querySelectorAll(".nav-menu a").forEach((link) => {
      const linkPath = new URL(link.href).pathname;
      if (
        linkPath === currentPage ||
        (currentPage === "/" && linkPath === "/index.html")
      ) {
        link.classList.add("active");
      }
    });
  }

  // ===================
  // Initialization
  // ===================

  async function init() {
    console.log("NSTCG Static Archive - Homepage initialized");

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

    console.log("Homepage ready");
  }

  // Start when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
