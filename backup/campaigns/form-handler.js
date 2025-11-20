/**
 * Campaign Form Handler
 * Handles form submissions for campaign pages
 */

(function() {
  'use strict';

  // Wait for DOM to be ready
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  // Main form handler
  function initFormHandler() {
    const form = document.getElementById('vote-commitment-form');
    if (!form) {
      console.log('[FormHandler] No form found with ID "vote-commitment-form"');
      return;
    }
    console.log('[FormHandler] Form handler initialized');

    // Handle form submission
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      console.log('[FormHandler] Form submission started');

      // Get form elements
      const submitButton = document.getElementById('submit-commitment');
      const originalButtonText = submitButton.textContent;

      // Disable button and show loading state
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';

      try {
        // Collect form data
        const formData = {
          voterName: document.getElementById('voter-name').value.trim(),
          voterEmail: document.getElementById('voter-email').value.trim(),
          voterPostcode: document.getElementById('voter-postcode').value.trim(),
          votingPriority: document.getElementById('voting-priority').value,
          voterMessage: document.getElementById('voter-message').value.trim(),
          voteCommitment: document.getElementById('vote-commitment').checked,
          pageSource: window.location.pathname,
          submittedAt: new Date().toISOString()
        };

        console.log('[FormHandler] Form data collected:', JSON.stringify(formData, null, 2));

        // Validate commitment checkbox
        if (!formData.voteCommitment) {
          console.error('[FormHandler] Validation failed: Commitment checkbox not checked');
          throw new Error('Please confirm your commitment to vote for change');
        }
        console.log('[FormHandler] Validation passed');

        // Submit to API
        console.log('[FormHandler] Submitting to API: /api/campaign-form');
        const response = await fetch('/api/campaign-form', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });

        console.log('[FormHandler] API response status:', response.status);
        const result = await response.json();
        console.log('[FormHandler] API response data:', JSON.stringify(result, null, 2));

        if (!response.ok || !result.success) {
          console.error('[FormHandler] API error:', result.error || 'Submission failed');
          throw new Error(result.error || 'Submission failed');
        }

        // Success! Show confirmation
        console.log('[FormHandler] Submission successful, showing confirmation');
        showConfirmation();
        
        // Reset form
        form.reset();
        console.log('[FormHandler] Form reset');
        
        // Hide form and show confirmation
        form.style.display = 'none';
        console.log('[FormHandler] Form hidden');

      } catch (error) {
        console.error('Form submission error:', error);
        showErrorMessage(error.message || 'Something went wrong. Please try again.');
      } finally {
        // Re-enable button
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    });
  }

  // Show success message
  function showSuccessMessage(message) {
    const existingMsg = document.querySelector('.form-message');
    if (existingMsg) existingMsg.remove();

    const msgDiv = document.createElement('div');
    msgDiv.className = 'form-message form-success';
    msgDiv.textContent = message;
    msgDiv.style.cssText = `
      background: #2ca02c;
      color: white;
      padding: 15px;
      margin: 20px 0;
      border-radius: 5px;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    const form = document.getElementById('vote-commitment-form');
    form.parentNode.insertBefore(msgDiv, form);
  }

  // Show error message
  function showErrorMessage(message) {
    const existingMsg = document.querySelector('.form-message');
    if (existingMsg) existingMsg.remove();

    const msgDiv = document.createElement('div');
    msgDiv.className = 'form-message form-error';
    msgDiv.textContent = message;
    msgDiv.style.cssText = `
      background: #dc3545;
      color: white;
      padding: 15px;
      margin: 20px 0;
      border-radius: 5px;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    const form = document.getElementById('vote-commitment-form');
    form.parentNode.insertBefore(msgDiv, form);

    // Remove error after 5 seconds
    setTimeout(() => msgDiv.remove(), 5000);
  }

  // Show confirmation (use existing HTML element)
  function showConfirmation() {
    const confirmation = document.getElementById('commitment-confirmation');
    if (confirmation) {
      console.log('[FormHandler] Showing confirmation element');
      confirmation.style.display = 'block';
      
      // Scroll to confirmation
      confirmation.scrollIntoView({ behavior: 'smooth', block: 'center' });
      console.log('[FormHandler] Scrolled to confirmation');
    } else {
      console.error('[FormHandler] Confirmation element not found: #commitment-confirmation');
    }
  }

  // Initialize when DOM is ready
  ready(initFormHandler);
})();