/**
 * Standalone Visitor Tracking Script
 * For static HTML pages not included in the build process
 * 
 * Usage: Add before closing </body> tag:
 * <script src="/campaigns/tracker.js"></script>
 */

(function() {
  'use strict';
  
  console.log('[Tracker] Initializing visitor tracking...');
  
  // Check if we've already tracked this page in this session
  try {
    const currentPage = window.location.href;
    const trackedPages = JSON.parse(sessionStorage.getItem('tracked-pages') || '[]');
    
    if (trackedPages.includes(currentPage)) {
      console.log('[Tracker] Page already tracked in this session:', currentPage);
      return;
    }
    
    // Add current page to tracked pages
    trackedPages.push(currentPage);
    sessionStorage.setItem('tracked-pages', JSON.stringify(trackedPages));
    console.log('[Tracker] Tracking new page visit:', currentPage);
    console.log('[Tracker] Total pages tracked in session:', trackedPages.length);
  } catch (e) {
    console.log('[Tracker] Session storage check failed:', e.message);
    // Continue tracking if sessionStorage fails
  }
  
  // Also prevent duplicate tracking in same page load
  if (window.__visitorTracked) {
    console.log('[Tracker] Already tracked this page load, skipping');
    return;
  }
  window.__visitorTracked = true;

  // Generate or retrieve session ID
  function getSessionId() {
    let sessionId = null;
    try {
      sessionId = sessionStorage.getItem('visitor-session-id');
      if (!sessionId) {
        sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
        sessionStorage.setItem('visitor-session-id', sessionId);
        console.log('[Tracker] Generated new session ID:', sessionId);
      } else {
        console.log('[Tracker] Retrieved existing session ID:', sessionId);
      }
    } catch (e) {
      // If sessionStorage fails, generate a temporary session ID
      sessionId = 'temp_' + Date.now();
      console.log('[Tracker] sessionStorage failed, using temporary ID:', sessionId, 'Error:', e.message);
    }
    return sessionId;
  }

  // Check if new visitor
  function isNewVisitor() {
    try {
      const visited = localStorage.getItem('has-visited');
      if (!visited) {
        localStorage.setItem('has-visited', 'true');
        console.log('[Tracker] New visitor detected');
        return true;
      }
      console.log('[Tracker] Returning visitor');
      return false;
    } catch (e) {
      // If localStorage fails, assume new visitor
      console.log('[Tracker] localStorage failed, assuming new visitor. Error:', e.message);
      return true;
    }
  }

  // Calculate page load time
  function getPageLoadTime() {
    try {
      // Use modern Navigation Timing API if available
      if (window.performance && window.performance.getEntriesByType) {
        const navEntries = window.performance.getEntriesByType('navigation');
        if (navEntries.length > 0) {
          const loadTime = Math.round(navEntries[0].loadEventEnd - navEntries[0].fetchStart);
          console.log('[Tracker] Page load time (Navigation API):', loadTime, 'ms');
          return loadTime;
        }
      }
      // Fallback to deprecated timing API if needed
      if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        if (timing.loadEventEnd && timing.navigationStart) {
          const loadTime = timing.loadEventEnd - timing.navigationStart;
          console.log('[Tracker] Page load time (Timing API):', loadTime, 'ms');
          return loadTime;
        }
      }
      console.log('[Tracker] Unable to calculate page load time');
    } catch (e) {
      console.log('[Tracker] Error calculating page load time:', e.message);
    }
    return 0;
  }

  // Send tracking data
  function sendTrackingData() {
    console.log('[Tracker] Preparing to send tracking data...');
    try {
      const visitorData = {
        // Page info
        pageUrl: window.location.href,
        pageTitle: document.title || 'Untitled Page',
        referrer: document.referrer || 'direct',
        
        // Screen info
        screenWidth: window.screen.width || 0,
        screenHeight: window.screen.height || 0,
        
        // Session info
        sessionId: getSessionId(),
        isNewVisitor: isNewVisitor(),
        
        // Performance
        pageLoadTime: getPageLoadTime(),
        
        // Timestamp
        timestamp: new Date().toISOString()
      };

      console.log('[Tracker] Visitor data collected:', JSON.stringify(visitorData, null, 2));

      // Create and send request
      const xhr = new XMLHttpRequest();
      // Always use absolute URL to ensure it works from any path
      const apiUrl = window.location.origin + '/api/track-visitor';
      console.log('[Tracker] Sending data to:', apiUrl);
      
      xhr.open('POST', apiUrl, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200 || xhr.status === 201) {
            console.log('[Tracker] Successfully sent tracking data. Response:', xhr.responseText);
          } else {
            console.error('[Tracker] Failed to send tracking data. Status:', xhr.status, 'Response:', xhr.responseText);
          }
        }
      };
      
      xhr.onerror = function() {
        console.error('[Tracker] Network error while sending tracking data');
      };
      
      xhr.send(JSON.stringify(visitorData));
      console.log('[Tracker] Request sent');
      
    } catch (error) {
      console.error('[Tracker] Error in sendTrackingData:', error);
      if (window.console && window.console.error) {
        console.error('Tracking error:', error);
      }
    }
  }

  // Wait for page to load completely before tracking
  if (document.readyState === 'complete') {
    // Page already loaded
    console.log('[Tracker] Page already loaded, sending data in 100ms');
    setTimeout(sendTrackingData, 100);
  } else {
    // Wait for page load
    console.log('[Tracker] Waiting for page load event');
    window.addEventListener('load', function() {
      console.log('[Tracker] Page load event fired, sending data in 100ms');
      setTimeout(sendTrackingData, 100);
    });
  }
})();