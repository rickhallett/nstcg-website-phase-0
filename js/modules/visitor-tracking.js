/**
 * Visitor Tracking Module
 * Sends anonymous visitor data to analytics endpoint
 */

// Generate or retrieve session ID
function getSessionId() {
  let sessionId = sessionStorage.getItem('visitor-session-id');
  if (!sessionId) {
    sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('visitor-session-id', sessionId);
  }
  return sessionId;
}

// Check if new visitor
function isNewVisitor() {
  const visited = localStorage.getItem('has-visited');
  if (!visited) {
    localStorage.setItem('has-visited', 'true');
    return true;
  }
  return false;
}

// Calculate page load time
function getPageLoadTime() {
  if (window.performance && window.performance.timing) {
    const timing = window.performance.timing;
    if (timing.loadEventEnd && timing.navigationStart) {
      return timing.loadEventEnd - timing.navigationStart;
    }
  }
  return 0;
}

// Main tracking function
export async function trackVisitor() {
  try {
    // Wait for page to fully load to get accurate timing
    if (document.readyState !== 'complete') {
      window.addEventListener('load', trackVisitor);
      return;
    }

    // Collect visitor data
    const visitorData = {
      // Page info
      pageUrl: window.location.href,
      pageTitle: document.title,
      referrer: document.referrer || 'direct',
      
      // Screen info
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      
      // Session info
      sessionId: getSessionId(),
      isNewVisitor: isNewVisitor(),
      
      // Performance
      pageLoadTime: getPageLoadTime(),
      
      // Timestamp
      timestamp: new Date().toISOString()
    };

    // Send to tracking endpoint
    const response = await fetch('/api/track-visitor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(visitorData)
    });

    if (!response.ok) {
      console.error('Visitor tracking failed:', response.statusText);
    }
    
  } catch (error) {
    // Fail silently to not affect user experience
    console.error('Visitor tracking error:', error);
  }
}

// Auto-track on module load
if (typeof window !== 'undefined') {
  trackVisitor();
}

// Export for manual tracking
export default { trackVisitor };