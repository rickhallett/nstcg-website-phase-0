/**
 * Cache Invalidation Module
 * Simple timestamp-based cache invalidation for user registration
 */

export class CacheInvalidation {
  // Cache validity duration (10 minutes)
  static CACHE_VALIDITY_MS = 10 * 60 * 1000;
  
  /**
   * Check if user registration cache is still valid
   * @returns {boolean} true if cache is valid, false if should be invalidated
   */
  static isRegistrationCacheValid() {
    const registrationTime = localStorage.getItem('nstcg_registration_time');
    
    if (!registrationTime) {
      return false; // No timestamp means invalid cache
    }
    
    const now = Date.now();
    const elapsed = now - parseInt(registrationTime, 10);
    
    // Cache is invalid if older than validity period
    return elapsed < this.CACHE_VALIDITY_MS;
  }
  
  /**
   * Clear user registration data from localStorage
   */
  static clearUserCache() {
    const keysToRemove = [
      'nstcg_registered',
      'nstcg_user_id',
      'nstcg_email',
      'nstcg_first_name',
      'nstcg_last_name',
      'nstcg_comment',
      'nstcg_registration_time',
      'nstcg_referral_code',
      'nstcg_share_count',
      'nstcg_last_share_date'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Also clear the registered class from HTML
    document.documentElement.classList.remove('user-registered');
  }
  
  /**
   * Validate and refresh cache on page load
   * This should be called early in the page lifecycle
   */
  static validateCacheOnLoad() {
    const isRegistered = localStorage.getItem('nstcg_registered') === 'true';
    
    if (isRegistered && !this.isRegistrationCacheValid()) {
      console.log('Registration cache expired, clearing user data...');
      this.clearUserCache();
      return false;
    }
    
    return isRegistered;
  }
  
  /**
   * Set registration timestamp when user registers
   */
  static setRegistrationTime() {
    localStorage.setItem('nstcg_registration_time', Date.now().toString());
  }
  
  /**
   * Force cache refresh (useful for testing or manual refresh)
   */
  static forceRefresh() {
    this.clearUserCache();
    window.location.reload();
  }
}

// Auto-validate on module load
if (typeof window !== 'undefined') {
  CacheInvalidation.validateCacheOnLoad();
}