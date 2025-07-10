// scripts/generate-test-users.js
import { createTestUserViaAPI } from "../tests/utils/data-generators";

async function generateUsers(count = 1) {
  // const baseUrl = 'http://localhost:3000';
  const baseUrl = "https://www.nstcg.org";

  for (let i = 0; i < count; i++) {
    try {
      const user = await createTestUserViaAPI(baseUrl);
      console.log(`✅ Created user: ${user.email}`);
    } catch (error) {
      console.error(`❌ Failed to create user ${i + 1}:`, error.message);
    }
  }
}

// Generate 5 users
generateUsers(5);
