# Cache Invalidation Strategy for NSTCG

## Current Issues

1. **localStorage Dependency**: System relies entirely on localStorage to track user registration status
2. **No Recovery Flow**: Users who clear localStorage cannot re-access their account
3. **Generated User Conflicts**: Mocked users create permanent email blocks without localStorage entries

## Proposed Solutions

### 1. Email-Based Recovery Flow (Recommended)

Add a "Already registered? Recover access" link that:
- Allows users to enter their email
- Sends a magic link to restore their session
- Repopulates localStorage with their user data

Implementation:
```javascript
// Add to form error handling
function showEmailError() {
  // ... existing code ...
  
  // Add recovery option
  const recoveryLink = document.createElement('a');
  recoveryLink.href = '#';
  recoveryLink.textContent = 'Already registered? Recover access';
  recoveryLink.onclick = (e) => {
    e.preventDefault();
    showRecoveryModal();
  };
}
```

### 2. Session-Based Validation

Check registration status server-side instead of relying solely on localStorage:
- On page load, validate stored user_id with server
- If invalid/missing, clear localStorage and allow re-registration
- Implement proper session management

### 3. Smart Duplicate Detection

Modify the `/api/submit-form` endpoint to:
- Check if email exists
- If yes, verify if it's a generated user (user_id starts with 'gen_')
- Allow real users to "claim" generated accounts
- Merge data appropriately

### 4. Cache Versioning

Implement cache versioning to force refresh when needed:
```javascript
const CACHE_VERSION = 'v1.2';
const storedVersion = localStorage.getItem('nstcg_cache_version');

if (storedVersion !== CACHE_VERSION) {
  // Clear old cache
  clearUserCache();
  localStorage.setItem('nstcg_cache_version', CACHE_VERSION);
}
```

### 5. Improve Generated User IDs

Make generated users more distinguishable:
- Keep the 'gen_' prefix for easy identification
- Add metadata to track generation source
- Consider adding expiration for test users

## Implementation Priority

1. **Immediate**: Add email recovery flow (minimal changes, high impact)
2. **Short-term**: Implement server-side validation
3. **Long-term**: Full session management system

## Benefits

- Users can recover access after clearing browser data
- Generated test users won't permanently block real emails
- Better user experience for returning visitors
- Maintains security while improving accessibility