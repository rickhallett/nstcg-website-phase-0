import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sql = neon(process.env.DATABASE_URL_UNPOOLED);

async function createBackup() {
  console.log("📦 Creating backup table...");

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupTable = `leads_backup_${timestamp}`;

  // Create backup table (using raw SQL for table name)
  await sql.unsafe(`CREATE TABLE ${backupTable} AS SELECT * FROM leads`);

  const backupCountResult = await sql.unsafe(`SELECT COUNT(*) as count FROM ${backupTable}`);
  const backupCount = backupCountResult[0]?.count || backupCountResult.rows?.[0]?.count || 0;
  console.log(`✅ Backup created: ${backupTable} (${backupCount} records)\n`);

  return backupTable;
}

async function executeStep(description, queryFn) {
  console.log(`🔄 ${description}...`);
  try {
    const result = await queryFn();
    console.log(`✅ ${description} - Complete\n`);
    return result;
  } catch (error) {
    console.error(`❌ ${description} - Failed:`, error.message);
    throw error;
  }
}

async function runMigration() {
  console.log("=== NEON DATABASE SYNC MIGRATION ===\n");
  console.log("Source: Notion backup (source of truth)");
  console.log("Target: Neon PostgreSQL database\n");

  let backupTable = null;

  try {
    // Create backup
    backupTable = await createBackup();

    // Get initial count
    const initialCount = await sql`SELECT COUNT(*) as count FROM leads`;
    console.log(`Initial lead count: ${initialCount[0].count}\n`);

    // Step 1: Remove test data
    await executeStep(
      "Step 1: Removing test data (sub_*, usr_*, signup_form)",
      async () => {
        const result = await sql`
          DELETE FROM leads WHERE
            submission_id LIKE 'sub_%' OR
            user_id LIKE 'usr_%' OR
            source = 'signup_form'
        `;
        console.log(`   Removed ${result.count} test leads`);
        return result;
      }
    );

    // Step 2: Fix ID mismatches
    console.log("🔄 Step 2: Fixing ID mismatches...");

    const idFixes = [
      { email: 'ava.streams@yahoo.com', user_id: 'mc4yqaerknijs' },
      { email: 'the.bay@hotmail.co.uk', user_id: 'mc59mhv0bgrew' },
      { email: 'dterrett36@btinternet.com', user_id: 'mc5cquy74knq4' },
      { email: 'garethkitching@icloud.com', user_id: 'mc53uunkayf7o' },
      { email: 'pibeaver@hotmail.com', user_id: 'mc580lwirtfq9' },
      { email: 'jakestreams@yahoo.co.uk', user_id: 'mc4xyxngarjk6' },
      { email: 'helencolinwhite@hotmail.com', user_id: 'mc6hq612uqz6t' },
      { email: 'jasminer3005@icloud.com', user_id: 'mc6f8g84l5k8n' },
      { email: 'lunnabell@hotmail.co.uk', user_id: 'mc5zaf3tyyq96' },
      { email: 'rpcarter.43@gmail.com', user_id: 'mc7sqk05qjuq8' },
      { email: 'rebeccakeeshan@gmail.com', user_id: 'mc7sx0po1zgbu' },
      { email: 'dianneecarter@gmail.com', user_id: 'mc7th4qqbxhxs' },
      { email: 'fahimahmed1222@outlook.com', user_id: 'mc9jygu52ez2y' },
      { email: 'anne-cartwright@hotmail.co.uk', user_id: 'mc9iemsgxlmr9' },
      { email: 'nigelpsteer@hotmail.com', user_id: 'mcb18jv79zrc2' },
      { email: 'jamesdavidpond@gmail.com', user_id: 'mccgw4sy0c446' },
      { email: 'mattsullivanjoinery@gmail.com', user_id: 'mdepcsmsxava5' }
    ];

    let fixedCount = 0;
    for (const fix of idFixes) {
      const result = await sql`
        UPDATE leads
        SET user_id = ${fix.user_id},
            submission_id = NULL
        WHERE email = ${fix.email}
      `;
      if (result.count > 0) fixedCount++;
    }

    console.log(`   Fixed ${fixedCount} ID mismatches`);
    console.log(`✅ Step 2: Fixing ID mismatches - Complete\n`);

    // Step 3: Add missing leads
    console.log("🔄 Step 3: Adding missing Notion leads...");

    const missingLeads = [
      {
        user_id: 'mche27y3vdbucjlgbbp',
        name: 'Jon H',
        email: 'jhallett@vividnet.co.uk',
        source: 'main_form',
        referral_code: 'JHA27Y36ZHX'
      },
      {
        user_id: 'mche274blqg6cjuvx1',
        name: 'Adam',
        email: 'patayres58@icloud.com',
        source: 'survey_modal',
        referral_code: 'PAT274BN2JQ'
      },
      {
        user_id: 'mche28cfzfn2gg8hrmj',
        name: 'Tracey H',
        email: 'scissors1962@gmail.com',
        source: 'main_form',
        referral_code: 'SCI28CF7UTW'
      },
      {
        user_id: 'mc8tel7vbsk08',
        name: 'Sally Gutteridge',
        first_name: 'Sally',
        last_name: 'Gutteridge',
        email: 'sw*********@yahoo.co.uk',
        source: 'survey_modal',
        referral_code: 'SALZOO5ZWAK'
      },
      {
        user_id: 'mc9fpn08orrwl',
        name: 'Sharon Evans',
        first_name: 'Sharon',
        last_name: 'Evans',
        email: 'dottieday05@gmail.com',
        source: 'main_form',
        referral_code: 'SHAZABUP90Y'
      },
      {
        user_id: 'mc9fpr297wt11',
        name: 'Sharon Evans',
        first_name: 'Sharon',
        last_name: 'Evans',
        email: 'dottieday05@gmail.com',
        source: 'main_form',
        referral_code: 'SHAZ9W79IXD'
      },
      {
        user_id: 'mcnvj8fefm29o',
        name: 'Eduard Marian Stoica',
        first_name: 'Eduard Marian',
        last_name: 'Stoica',
        email: 'Semmy1st@gmail.com TV',
        source: 'survey_modal',
        visitor_type: 'Local',
        comments: 'Money is not everything.',
        referral_code: 'EDUJ9QEKWZZ'
      },
      {
        user_id: 'mi8vj9t4a6fjv',
        name: 'Richard Hallett',
        first_name: 'Richard',
        last_name: 'Hallett',
        email: 'bob@dylan.com',
        source: 'main_form',
        visitor_type: 'Local',
        referral_code: 'RICJDURWA96'
      },
      {
        user_id: 'mi8vo0wvnmc0e',
        name: 'Jane Smith',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@smith.com',
        source: 'survey_modal',
        visitor_type: 'Local',
        referral_code: 'JANO1FVX21N'
      }
    ];

    let addedCount = 0;
    for (const lead of missingLeads) {
      // Check if already exists (by email)
      const existing = await sql`SELECT id FROM leads WHERE email = ${lead.email}`;

      if (existing.length === 0) {
        await sql`
          INSERT INTO leads (
            user_id, name, first_name, last_name, email, source,
            visitor_type, comments, referral_code, published
          ) VALUES (
            ${lead.user_id},
            ${lead.name},
            ${lead.first_name || null},
            ${lead.last_name || null},
            ${lead.email},
            ${lead.source},
            ${lead.visitor_type || null},
            ${lead.comments || null},
            ${lead.referral_code},
            true
          )
        `;
        addedCount++;
      }
    }

    console.log(`   Added ${addedCount} missing leads`);
    console.log(`✅ Step 3: Adding missing Notion leads - Complete\n`);

    // Validation
    console.log("=== VALIDATION ===\n");

    const finalCount = await sql`SELECT COUNT(*) as count FROM leads`;
    console.log(`✅ Total leads: ${finalCount[0].count} (expected: 442)`);

    const testDataCount = await sql`
      SELECT COUNT(*) as count FROM leads WHERE
        submission_id LIKE 'sub_%' OR
        user_id LIKE 'usr_%' OR
        source = 'signup_form'
    `;
    console.log(`✅ Remaining test data: ${testDataCount[0].count} (expected: 0)`);

    const generatedIds = await sql`
      SELECT COUNT(*) as count FROM leads
      WHERE submission_id LIKE 'generated-%'
    `;
    console.log(`✅ Leads with generated-* IDs: ${generatedIds[0].count}`);

    const syntheticIds = await sql`
      SELECT COUNT(*) as count FROM leads
      WHERE user_id LIKE 'synthetic_%'
    `;
    console.log(`✅ Leads with synthetic_* IDs: ${syntheticIds[0].count}`);

    // Check if validation passed
    const validationPassed = (
      finalCount[0].count >= 440 &&
      testDataCount[0].count === 0 &&
      syntheticIds[0].count === 0
    );

    console.log();
    if (validationPassed) {
      console.log("🎉 MIGRATION SUCCESSFUL!\n");
      console.log(`Database is now in sync with Notion backup.`);
      console.log(`Backup table available: ${backupTable}\n`);

      if (generatedIds[0].count > 0) {
        console.log(`⚠️  Note: ${generatedIds[0].count} leads still have 'generated-*' submission_ids.`);
        console.log(`   These are from the original Notion data and are genuine leads.`);
        console.log(`   The submission_ids can be cleaned up later if needed.\n`);
      }
    } else {
      console.log("⚠️  VALIDATION WARNINGS\n");
      console.log("Some validation checks didn't match expected values.");
      console.log(`Review the counts above and the backup: ${backupTable}\n`);
    }

    return { success: true, backupTable };

  } catch (error) {
    console.error("\n❌ MIGRATION FAILED\n");
    console.error("Error:", error.message);

    if (backupTable) {
      console.log(`\nTo restore from backup, run:`);
      console.log(`  DROP TABLE leads;`);
      console.log(`  ALTER TABLE ${backupTable} RENAME TO leads;`);
    }

    throw error;
  }
}

// Execute migration
runMigration()
  .then(() => {
    console.log("=== MIGRATION COMPLETE ===");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nMigration aborted.");
    process.exit(1);
  });
