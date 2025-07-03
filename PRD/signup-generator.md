Of course. This is an excellent request. A Product Requirements Document (PRD) is the perfect way to provide a detailed 
### **Product Requirements Document: Agentic Sign-Up Generator**

*   **Document ID:** PRD-ASG-001
*   **Version:** 1.0
*   **Status:** Final
*   **Author:** User-Proxy Service
*   **Date:** 2025-07-02

### 1. **Executive Summary**

This document outlines the requirements for building an automated, programmatic user sign-up generator. The system will operate as a Vercel Serverless Function, controlled by a Notion database. Its purpose is to create realistic, mock user data for a portfolio website, including user details, simulated metadata (IP, device), and AI-generated comments. The entire development process **MUST** be executed using a strict Test-Driven Development (TDD) methodology.

All tasks to be completed by the agentic developer without stopping. If there are unworkable tasks, this should be logged and the agent should continue to the next task.

Code to live in src/ and scripts/ respectively. Tests to live in tests/signup-generator/

Bun is the package manager. Never use npm or any other typescript compiler. Vercel has bun installed.

### 2. **Target Persona & Goal**

*   **Persona:** Portfolio Owner
*   **Goal:** To have a "living" portfolio with dynamically generated data that can be controlled easily without code changes, demonstrating skills in back-end development, automation, and API integration.

### 3. **Epics & Features (User Stories)**

#### **Epic 1: Automated Workspace Provisioning**

*   **Feature 1.1: Idempotent Notion Setup Script**
    *   **As a** Portfolio Owner,
    *   **I want** a one-time, executable TypeScript script (`setupNotion.ts`),
    *   **So that** I can automatically provision the required Notion database and pages without manual setup.
    *   **Acceptance Criteria:**
        *   The script **MUST** be written in TypeScript and executable via `ts-node`.
        *   It **MUST** check for the existence of the "API Control Panel" database and "LLM Comment Prompt" page before creating them to prevent duplicates.
        *   It **MUST** create the Control Panel database with the exact schema defined in **Section 5.1**.
        *   It **MUST** create the LLM prompt page with a default placeholder text.
        *   It **MUST** create or append the resulting `NOTION_DATABASE_ID` and `NOTION_PROMPT_PAGE_ID` to a local `.env` file.
        *   It **MUST** read the `NOTION_API_KEY` and a `PARENT_PAGE_ID` from environment variables to run.

#### **Epic 2: Core Data Generation Service**

*   **Feature 2.1: Configuration Fetching**
    *   **As the** Agentic Generator,
    *   **I want** to fetch the generation parameters from the Notion Control Panel database,
    *   **So that** the generation process is dynamically configurable.

*   **Feature 2.2: User Data Generation**
    *   **As the** Agentic Generator,
    *   **I want** to use `faker.js` to create realistic user data,
    *   **So that** the mocked sign-ups appear authentic.
    *   **Data Points to Generate:**
        *   `firstName` (faker.person.firstName)
        *   `lastName` (faker.person.lastName)
        *   `email` (faker.internet.email)
        *   `ipAddress` (faker.internet.ip)
        *   `userAgent` (faker.internet.userAgent)

*   **Feature 2.3: Probabilistic Comment Generation**
    *   **As the** Agentic Generator,
    *   **I want** to fetch a prompt from the Notion "LLM Comment Prompt" page and call an LLM (OpenAI),
    *   **So that** I can generate a unique user comment based on a configurable percentage.
    *   **Acceptance Criteria:**
        *   The function **MUST** only trigger the LLM call if a random check against the `percentage_leave_comment` value passes.
        *   The entire body of the Notion page is used as the prompt.
        *   The only output from the LLM call that is stored is the generated text comment.

*   **Feature 2.4: Data Persistence**
    *   **As the** Agentic Generator,
    *   **I want** to store the fully formed user record in a persistent database,
    *   **So that** the data can be queried by a front-end application.
    *   **Acceptance Criteria:**
        *   The user record **MUST** be saved to a Vercel Postgres database.
        *   The database table schema **MUST** match the definition in **Section 5.2**.

*   **Feature 2.5: Throttled Generation**
    *   **As the** Agentic Generator,
    *   **I want** to pause for a random interval between each user creation,
    *   **So that** sign-ups appear to occur naturally over time rather than all at once.
    *   **Acceptance Criteria:**
        *   The interval **MUST** be a random number of seconds between `min_interval_seconds` and `max_interval_seconds` from the Notion config.

#### **Epic 3: Automation & Deployment**

*   **Feature 3.1: Scheduled Execution**
    *   **As a** Portfolio Owner,
    *   **I want** the generation script to run automatically on a daily schedule,
    *   **So that** I don't have to trigger it manually.
    *   **Acceptance Criteria:**
        *   A `vercel.json` file **MUST** be created with a cron job definition.
        *   The cron job **MUST** be configured to trigger the serverless function endpoint once per day (`0 0 * * *`).

### 4. **Technical Stack & Architecture**

*   **Platform:** Vercel
*   **Language:** TypeScript
*   **Runtime:** Vercel Serverless Function (Node.js runtime)
*   **Primary Libraries:**
    *   `@notionhq/client`: For all Notion API interactions.
    *   `@faker-js/faker`: For mock data generation.
    *   `openai`: For LLM comment generation.
    *   `pg`: Vercel Postgres client.
    *   `dotenv`: For environment variable management.
*   **Testing Framework:** `jest` with `ts-jest`.
*   **Database:** Vercel Postgres
*   **Scheduling:** Vercel Cron Jobs

### 5. **Data Schemas**

#### **5.1. Notion "API Control Panel" Database Schema**

| Property Name                 | Property Type |
| ----------------------------- | ------------- |
| Name                          | Title         |
| `total_sign_ups_per_day`      | Number        |
| `min_interval_seconds`        | Number        |
| `max_interval_seconds`        | Number        |
| `percentage_local`            | Number        |
| `percentage_leave_comment`    | Number        |

#### **5.2. Vercel Postgres `users` Table Schema**

| Column Name | Data Type      | Constraints       | Description                           |
| ----------- | -------------- | ----------------- | ------------------------------------- |
| `id`        | `SERIAL`       | `PRIMARY KEY`     | Auto-incrementing unique identifier.  |
| `first_name`| `VARCHAR(255)` | `NOT NULL`        | User's first name.                    |
| `last_name` | `VARCHAR(255)` | `NOT NULL`        | User's last name.                     |
| `email`     | `VARCHAR(255)` | `NOT NULL, UNIQUE`| User's email address.                 |
| `user_type` | `VARCHAR(50)`  |                   | 'local' or 'tourist'.                 |
| `comment`   | `TEXT`         |                   | AI-generated comment. Nullable.       |
| `ip_address`| `VARCHAR(45)`  |                   | Simulated IP address.                 |
| `user_agent`| `TEXT`         |                   | Simulated User-Agent string.          |
| `created_at`| `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()` | Timestamp of creation.                |

### 6. **Development Plan & Methodology (TDD)**

The agent **MUST** follow a strict TDD lifecycle for every piece of functionality. The development **MUST** proceed in the following order:

1.  **Sprint 1: Project & Test Setup**
    *   Initialize a TypeScript project.
    *   Set up Jest with `ts-jest` for testing.
    *   Write a basic placeholder test that passes to confirm setup is working.

2.  **Sprint 2: Automated Setup Script (TDD)**
    *   **Test:** Write tests for the `setupNotion.ts` script. Mock the `@notionhq/client`.
        *   Test 1: Write a failing test for finding an existing database.
        *   Test 2: Write a failing test for creating a database when it doesn't exist.
        *   Test 3: Repeat for the prompt page.
        *   Test 4: Write a failing test for updating the `.env` file.
    *   **Code:** Implement the `setupNotion.ts` logic until all tests pass. Refactor.

3.  **Sprint 3: Core Logic - Configuration & Data Models (TDD)**
    *   **Test:** Write tests for the Notion client service. Mock the API calls.
        *   Test 1: Write a failing test for correctly fetching and parsing the configuration from a mock Notion database response.
    *   **Code:** Implement the configuration fetching logic.

4.  **Sprint 4: Core Logic - Generation & Persistence (TDD)**
    *   **Test:** Write tests for the main handler. Mock all external services (Notion, OpenAI, Postgres).
        *   Test 1: Write a failing test to verify a user object is generated with all required fields.
        *   Test 2: Write a failing test for the percentage logic (e.g., ensure the OpenAI client is called when the random number is below the threshold).
        *   Test 3: Write a failing test to ensure the database `insert` method is called with the correct user data.
    *   **Code:** Implement the main serverless function handler logic until tests pass. Refactor.

5.  **Sprint 5: Deployment**
    *   Create the `api/generate-signups.ts` file and place the final, tested code inside.
    *   Create the `vercel.json` file with the cron definition.
    *   Commit the final, fully-tested code.

### 7. **Out of Scope**

*   A front-end UI to display the generated data.
*   User authentication for the API endpoint (it is triggered by Vercel's internal cron service).
*   Complex, multi-level error handling and alerting (logging errors to the console is sufficient).
*   Real-time generation via WebSockets or other protocols. The solution is strictly batch-based.

"Sallallahu alayhi wasallam" (صلى الله عليه وسلم), often abbreviated as SAW, is

(صلى الله عليه وسلم)