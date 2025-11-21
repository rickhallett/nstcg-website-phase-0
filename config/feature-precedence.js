/**
 * Feature Flag Precedence Logic
 *
 * Implements the precedence rules for feature flags:
 * 1. Environment variable (if set)
 * 2. Default value as fallback
 */

// Cache for merged feature flags
let mergedFeaturesCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Apply precedence rules to determine final feature value
 * @param {string} envVar - Environment variable name
 * @param {boolean} defaultValue - Default value if nothing else is set
 * @returns {boolean} Final feature flag value
 */
function applyPrecedence(envVar, defaultValue) {
  // Check environment variable
  if (process.env[envVar] !== undefined) {
    return process.env[envVar] === 'true';
  }

  // Fall back to default
  return defaultValue;
}

/**
 * Get feature flags with precedence applied
 * @param {Object} defaultFeatures - Default feature configuration
 * @returns {Promise<Object>} Merged feature flags with precedence applied
 */
export async function getFeaturesWithPrecedence(defaultFeatures) {
  // Check cache
  if (mergedFeaturesCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return mergedFeaturesCache;
  }

  // Deep clone default features to avoid mutation
  const mergedFeatures = JSON.parse(JSON.stringify(defaultFeatures));

  // Apply precedence for each feature
  const applyToCategory = (category, envPrefix) => {
    for (const [key, defaultValue] of Object.entries(defaultFeatures[category])) {
      const envVar = `${envPrefix}_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`;

      mergedFeatures[category][key] = applyPrecedence(envVar, defaultValue);
    }
  };

  // Apply to each category
  applyToCategory('donations', 'FEATURE');
  applyToCategory('campaignCosts', 'FEATURE');
  applyToCategory('leaderboard', 'FEATURE');
  applyToCategory('referralScheme', 'FEATURE');
  applyToCategory('ui', 'FEATURE');

  // Update cache
  mergedFeaturesCache = mergedFeatures;
  cacheTimestamp = Date.now();

  return mergedFeatures;
}

/**
 * Check a single feature with precedence
 * @param {string} featurePath - Dot notation path (e.g., 'donations.enabled')
 * @param {string} envVar - Environment variable name
 * @param {boolean} defaultValue - Default value
 * @returns {Promise<boolean>} Feature flag value with precedence applied
 */
export async function checkFeatureWithPrecedence(featurePath, envVar, defaultValue) {
  return applyPrecedence(envVar, defaultValue);
}

/**
 * Clear precedence cache
 */
export function clearPrecedenceCache() {
  mergedFeaturesCache = null;
  cacheTimestamp = 0;
}

export default {
  getFeaturesWithPrecedence,
  checkFeatureWithPrecedence,
  clearPrecedenceCache
};