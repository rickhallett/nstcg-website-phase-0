/**
 * Static Data Loader
 *
 * Simple utility to load static JSON data files for the archived site.
 * Replaces all API calls with local file fetches.
 */

/**
 * Load site configuration (participant count, features, etc.)
 */
async function loadConfig() {
  try {
    const response = await fetch('/data/config/site-config.json');
    if (!response.ok) throw new Error('Failed to load config');
    return await response.json();
  } catch (error) {
    console.error('Error loading config:', error);
    return {
      finalCount: 416,
      publishedCount: 416,
      todayCount: 0,
      weekCount: 0,
      campaignStatus: 'archived',
      features: {
        donations: false,
        leaderboard: false,
        referrals: false,
        forms: false
      }
    };
  }
}

/**
 * Load all participants data
 */
async function loadAllParticipants() {
  try {
    const response = await fetch('/data/participants/all-participants.json');
    if (!response.ok) throw new Error('Failed to load participants');
    const data = await response.json();
    return {
      participants: data,
      totalCount: data.length
    };
  } catch (error) {
    console.error('Error loading participants:', error);
    return {
      participants: [],
      totalCount: 0
    };
  }
}

/**
 * Load recent signups for live feed
 */
async function loadRecentSignups() {
  try {
    const response = await fetch('/data/participants/recent-signups.json');
    if (!response.ok) throw new Error('Failed to load recent signups');
    const data = await response.json();
    return {
      signups: data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error loading recent signups:', error);
    return {
      signups: [],
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Load comments for thought bubbles
 */
async function loadComments() {
  try {
    const response = await fetch('/data/participants/comments.json');
    if (!response.ok) throw new Error('Failed to load comments');
    return await response.json();
  } catch (error) {
    console.error('Error loading comments:', error);
    return [];
  }
}

/**
 * Get participant count (for backward compatibility with existing code)
 */
async function getCount() {
  const config = await loadConfig();
  return { count: config.finalCount };
}

// Export functions for use in other modules (will be converted to global scope later)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadConfig,
    loadAllParticipants,
    loadRecentSignups,
    loadComments,
    getCount
  };
}

// Also expose to global scope for non-module usage
if (typeof window !== 'undefined') {
  window.DataLoader = {
    loadConfig,
    loadAllParticipants,
    loadRecentSignups,
    loadComments,
    getCount
  };
}
