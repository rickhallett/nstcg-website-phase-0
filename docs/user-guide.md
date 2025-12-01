# NSTCG Website User Guide
## How to Update the Website Using AI Assistants

**For:** Non-technical users who want to make updates to the website
**Tools:** Claude Code (Web), ChatGPT, or other AI assistants
**Last Updated:** December 2025

---

## Table of Contents

1. [What You Need to Know](#what-you-need-to-know)
2. [Getting Started with AI Assistants](#getting-started-with-ai-assistants)
3. [How to Use the llm.txt File](#how-to-use-the-llmtxt-file)
4. [Common Tasks and How to Request Them](#common-tasks-and-how-to-request-them)
5. [Understanding Complexity Levels](#understanding-complexity-levels)
6. [What You Can and Cannot Change](#what-you-can-and-cannot-change)
7. [Step-by-Step Examples](#step-by-step-examples)
8. [Testing Your Changes](#testing-your-changes)
9. [Publishing Changes](#publishing-changes)
10. [Troubleshooting](#troubleshooting)

---

## What You Need to Know

### About This Website

This is a **static archive** of the NSTCG campaign website. It preserves the history of a community activism campaign that engaged 416 participants.

**Key Facts:**
- The website is "frozen" as a historical record
- No active forms or user registration (intentionally disabled)
- Contains real participant data (anonymized for privacy)
- Built with simple HTML, CSS, and JavaScript
- No database or complex backend systems

**Think of it like:** A digital museum exhibit. You can update the displays and descriptions, but you shouldn't add interactive features that suggest it's still an active campaign.

---

## Getting Started with AI Assistants

### Recommended AI Assistant: Claude Code (Web)

[Claude Code](https://claude.ai/code) is the easiest option because:
- It can read and edit files directly
- It understands website code
- It can test changes immediately
- It's designed for this type of work

**Alternatives:** ChatGPT with Code Interpreter, Cursor, or similar AI coding tools

### What AI Assistants Can Do

AI assistants can help you:
- ✅ Change text on any page
- ✅ Update colors and fonts
- ✅ Add new sections to pages
- ✅ Modify layouts and spacing
- ✅ Hide or show content
- ✅ Update images (if you provide them)
- ✅ Fix broken links
- ✅ Adjust mobile responsiveness

### What to Prepare Before Asking

1. **Know which page** you want to change (homepage, feeds, share, etc.)
2. **Be specific** about what you want to change
3. **Have examples ready** if you want something to look a certain way
4. **Ask to see current content first** if you're not sure what's there

---

## How to Use the llm.txt File

### What is llm.txt?

The `llm.txt` file is a special instruction manual that helps AI assistants understand this website better. It helps them:
- Ask you the right clarifying questions
- Tell you how long changes will take
- Warn you about complex or restricted changes
- Suggest alternatives if something isn't possible

### How to Use It

#### Method 1: Copy and Paste (Recommended)

1. Open the `llm.txt` file in this project
2. Copy the entire contents
3. Start a conversation with your AI assistant
4. Paste the llm.txt contents as your first message
5. Then make your request

**Example conversation:**
```
You: [Paste entire llm.txt file]

     I want to change the homepage title

AI: I'd be happy to help! To make sure I update the right content:
    1. What should the new title say?
    2. Would you like me to show you the current title first?

You: Yes, show me the current title first

AI: The current homepage title is "North Swanage Traffic Consultation"
    What would you like it to say instead?

You: Change it to "North Swanage Campaign Archive"

AI: ✓ SIMPLE CHANGE (5 min)
    I'll update the title. Ready to proceed?
```

#### Method 2: Reference It

If your AI assistant can read files in the project:

```
You: Read llm.txt and help me update the website homepage
```

---

## Common Tasks and How to Request Them

### Task 1: Change Text on a Page

**Good Request:**
```
I want to change the main heading on the homepage from
"[current text]" to "[new text]"
```

**What the AI will ask:**
- Confirmation that you mean the main heading
- If you want to see the current text first
- If this should affect other pages

**Time:** 5-10 minutes (SIMPLE)

---

### Task 2: Update Colors

**Good Request:**
```
I want to change the blue accent color across the whole site
to a darker blue. Can you show me the current blue first?
```

**What the AI will ask:**
- Which specific blue (buttons, links, headers, etc.)
- Your preferred new color (name or hex code)
- If you want to see examples

**Time:** 5-10 minutes (SIMPLE)

---

### Task 3: Add a New Section

**Good Request:**
```
I want to add a new section on the homepage below the participant
counter that says [describe content]. It should have a heading and
a few paragraphs of text.
```

**What the AI will ask:**
- What the heading should say
- What the paragraph text should be
- If you want any special styling
- Where exactly it should appear

**Time:** 15-30 minutes (MODERATE)

---

### Task 4: Hide or Show Content

**Good Request:**
```
I want to hide the "Shore Road Impact Zone" section on the homepage
but keep it in the code in case we need it later
```

**What the AI will ask:**
- Confirmation that you want it hidden, not deleted
- If this affects other pages

**Time:** 5-10 minutes (SIMPLE)

---

### Task 5: Update Participant Data

**Good Request:**
```
I need to update one participant's information. Their current name
is [name] and I need to change it to [new name]
```

**What the AI will ask:**
- ⚠️ Confirmation that you want to modify historical data
- Which specific participant
- What exact changes to make
- If you've backed up the data file

**Time:** 15-20 minutes (MODERATE)
**Warning:** This modifies historical records - proceed with caution

---

### Task 6: Add Images

**Good Request:**
```
I want to replace the current logo image with a new one.
I have the new image file ready at [path/to/image.png]
```

**What the AI will ask:**
- Where the current image is located
- If the new image has the same dimensions
- If you want to keep the old image as backup

**Time:** 10-15 minutes (SIMPLE)

---

## Understanding Complexity Levels

The AI assistant will tell you how complex your request is. Here's what each level means:

### ✓ SIMPLE (5-10 minutes)
- **What it means:** Quick, straightforward changes
- **Examples:** Text updates, color changes, hiding elements
- **Files changed:** Usually 1-2 files
- **Your involvement:** Just approve and test

### ⚠ MODERATE (15-30 minutes)
- **What it means:** Requires multiple changes or new content
- **Examples:** New sections, layout changes, updating data
- **Files changed:** Usually 2-5 files
- **Your involvement:** May need to provide more details, test thoroughly

### ⚠️ COMPLEX (30-60 minutes)
- **What it means:** Significant changes affecting multiple pages
- **Examples:** New pages, major design overhauls, custom features
- **Files changed:** 5+ files
- **Your involvement:** Expect multiple rounds of clarification, testing

### ❌ ARCHIVE-RESTRICTED
- **What it means:** Not possible or conflicts with archive purpose
- **Examples:** Re-enabling forms, adding databases, user tracking
- **Why restricted:** Would contradict the historical nature of the archive
- **Alternative:** The AI will suggest a compatible alternative

---

## What You Can and Cannot Change

### ✅ Easy to Change (Anyone Can Request)

**Text Content:**
- Headlines and titles
- Descriptions and paragraphs
- Button labels
- Page copy

**Visual Design:**
- Colors (backgrounds, text, accents)
- Fonts and text sizes
- Spacing and margins
- Layout arrangements

**Content Visibility:**
- Hide or show sections
- Reorder content
- Add new text sections
- Update images

**Links:**
- Change link destinations
- Update link text
- Add new links
- Fix broken links

### ⚠️ Moderate Changes (May Need Discussion)

**Structure:**
- Add new sections to pages
- Restructure page layouts
- Create new content areas
- Modify navigation

**Data:**
- Update participant information
- Add/remove comments
- Modify counts or statistics

**Styling:**
- Create new design components
- Major visual overhauls
- Custom animations
- Complex responsive design

### ❌ Cannot Change (Archive Restrictions)

**Interactive Features:**
- Cannot re-enable user registration
- Cannot add working contact forms
- Cannot implement user accounts
- Cannot add comment submission

**Backend Systems:**
- Cannot add databases
- Cannot implement APIs
- Cannot add payment processing
- Cannot enable analytics tracking

**Why?** This website is preserved as a historical archive. Adding these features would suggest it's still an active campaign, which it's not.

**Alternative:** If you need these features, consider creating a NEW website and linking to this archive.

---

## Step-by-Step Examples

### Example 1: Changing Homepage Header Text

**Step 1: Start the conversation**
```
You: [Paste llm.txt contents]

     I want to change the header on the homepage
```

**Step 2: AI asks for clarification**
```
AI: I'd be happy to help! Which header specifically?
    - The main page title (big heading)
    - The badge that says "CAMPAIGN ENDED"
    - Another heading?

    Would you like me to show you the current headers?
```

**Step 3: You provide specifics**
```
You: The badge that says "CAMPAIGN ENDED"
```

**Step 4: AI confirms and assesses**
```
AI: ✓ SIMPLE CHANGE (5 min)

    I'll update the badge from "CAMPAIGN ENDED" to your new text.
    What should the new text say?
```

**Step 5: You provide new text**
```
You: Make it say "Campaign Archive"
```

**Step 6: AI implements**
```
AI: ✅ Done! I've updated index.html line 145.

    The badge now says "Campaign Archive"

    To test: Open index.html in your browser

    Need any adjustments?
```

---

### Example 2: Updating Site Colors

**Step 1: Make your request**
```
You: [Paste llm.txt contents]

     I want to change the blue color across the site to something darker
```

**Step 2: AI shows current colors**
```
AI: Let me show you the current blue colors:

    Primary blue: #3b82f6 (bright blue)
    Used for: buttons, links, accents

    Would you like me to suggest some darker blue options?
```

**Step 3: Choose new color**
```
You: Yes, show me options
```

**Step 4: AI provides options**
```
AI: Here are three darker blue options:

    Option 1: #1e40af (navy blue)
    Option 2: #2563eb (medium dark blue)
    Option 3: #1d4ed8 (rich blue)

    Which one would you prefer? Or provide your own hex code.
```

**Step 5: Make selection**
```
You: Option 2 looks good
```

**Step 6: AI implements**
```
AI: ✓ SIMPLE CHANGE (5 min)

    ✅ Done! Updated css/base/variables.css

    Changed primary blue from #3b82f6 to #2563eb
    This affects buttons, links, and accent colors site-wide.

    To test: Refresh your browser and check buttons and links
```

---

### Example 3: Adding a New Section

**Step 1: Describe what you want**
```
You: [Paste llm.txt contents]

     I want to add a new section on the homepage that thanks
     everyone who participated in the campaign
```

**Step 2: AI asks for details**
```
AI: ⚠ MODERATE CHANGE (15-20 min)

    Great idea! To create this section, I need:

    1. What should the section heading be?
    2. What should the body text say?
    3. Where should it appear? (top, middle, bottom, or after a
       specific section)
    4. Should it have any special styling? (background color, etc.)
```

**Step 3: Provide details**
```
You:
    1. Heading: "Thank You to Our Community"
    2. Body text: "This campaign succeeded because 416 community
       members stood together for safer roads. Your voices made
       a difference."
    3. Put it right after the participant counter
    4. Give it a light gray background
```

**Step 4: AI confirms and implements**
```
AI: Perfect! Let me create this section.

    ✅ Done! Changes made:
    - Added new section in index.html after participant counter
    - Created css/components/thank-you.css with light gray background
    - Built production files

    Files modified:
    - index.html (added HTML)
    - css/components/thank-you.css (new file)
    - css/main.css (imported new CSS)

    To test: Open index.html and look below the participant counter
```

---

## Testing Your Changes

After the AI makes changes, always test them before publishing.

### Local Testing (On Your Computer)

**Method 1: Python Server (Recommended)**
```bash
# Open terminal in project folder
python3 -m http.server 8000

# Then open browser to:
http://localhost:8000
```

**Method 2: Direct File Opening**
```
Right-click index.html → Open with → Your browser
```
⚠️ Note: Some features may not work with file:// URLs

### What to Check

**Visual Check:**
- [ ] Does the text say what you wanted?
- [ ] Are colors correct?
- [ ] Is spacing/layout right?
- [ ] Does it look good on mobile? (resize browser window)

**Functional Check:**
- [ ] Do all links work?
- [ ] Do buttons appear correctly?
- [ ] Does navigation work?
- [ ] Are images loading?

**Cross-Page Check:**
- [ ] If change affects multiple pages, check all of them
- [ ] Verify navigation between pages still works

### If Something Looks Wrong

Tell the AI specifically what's wrong:

**Good feedback:**
```
The text updated correctly, but the color is too dark. Can you
make it a bit lighter?
```

**Bad feedback:**
```
It doesn't look right
```

The more specific you are, the faster the AI can fix it.

---

## Publishing Changes

### For Vercel Deployment (Automatic)

If this site is connected to Vercel:

**Step 1: Build production files**
```bash
npm install  # First time only
npm run build
```

**Step 2: Commit changes**
```bash
git add .
git commit -m "Update homepage header text"
```

**Step 3: Push to GitHub**
```bash
git push origin main
```

**Step 4: Wait for deployment**
- Vercel automatically builds and deploys
- Takes 2-5 minutes
- Check the live site after deployment completes

### For Manual Deployment

If you're deploying manually:

**Step 1: Build production files**
```bash
npm run build
```

**Step 2: Upload to your server**
- Upload all HTML files
- Upload the `dist/` folder
- Upload the `data/` folder
- Upload the `images/` folder

**Don't upload:**
- `css/` folder (source files, not needed)
- `js/` folder (source files, not needed)
- `docs/` folder (documentation)
- `node_modules/` folder

---

## Troubleshooting

### "The AI is asking too many questions"

**Why:** The AI wants to make sure it understands correctly
**Solution:** Be more specific in your initial request

**Instead of:**
```
"Update the website"
```

**Try:**
```
"Update the homepage title to say 'Campaign Archive' instead
of the current text"
```

---

### "The changes didn't work"

**Possible reasons:**

1. **Forgot to build:**
   ```bash
   npm run build
   ```

2. **Browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

3. **Wrong file changed:**
   - Tell AI: "That didn't work. Can you check if you edited the right file?"

4. **Syntax error:**
   - Ask AI: "Can you verify the syntax is correct?"

---

### "The AI says my request is ARCHIVE-RESTRICTED"

**What it means:** Your request conflicts with the archive's purpose

**Common examples:**
- Re-enabling forms
- Adding user registration
- Implementing databases

**What to do:**
1. Ask the AI: "What's a good alternative that works with the archive?"
2. Consider if you really need that feature, or if there's a simpler way

**Example:**
```
You: Add a contact form

AI: ❌ ARCHIVE-RESTRICTED
    Contact forms need a backend server, which this archive doesn't have.

    Alternative: I can add a "Contact Information" section with:
    - Email address
    - Phone number
    - Physical address

    Would that work instead?
```

---

### "I don't understand the technical terms"

**What to do:**
- Tell the AI: "Can you explain that in simpler terms?"
- Ask: "What does [term] mean?"

The AI should always be willing to explain things more simply.

---

### "I want to undo a change"

**If you haven't committed yet:**
```bash
git checkout -- filename.html
```

**If you've committed but not pushed:**
```bash
git reset HEAD~1
```

**If you've pushed to production:**
- Ask the AI: "Can you revert that change and restore the original?"

**Best practice:** Always test locally before pushing to production

---

## Tips for Working with AI Assistants

### Do's ✅

1. **Be specific:** "Change the homepage title" is better than "update the site"
2. **Ask to see first:** "Show me the current design" helps prevent mistakes
3. **Test before publishing:** Always check changes locally first
4. **Ask questions:** If you don't understand, ask the AI to explain
5. **Give feedback:** "That's perfect!" or "Can you make it darker?" helps the AI learn
6. **One change at a time:** Easier to test and troubleshoot

### Don'ts ❌

1. **Don't be vague:** "Make it better" doesn't give the AI enough information
2. **Don't skip testing:** Always check changes before publishing
3. **Don't rush:** Take time to review what the AI proposes
4. **Don't assume:** If you're unsure, ask the AI to show you
5. **Don't mix unrelated changes:** Keep requests focused

---

## Getting Help

### When to Ask for Technical Help

You might need a technical person if:
- The AI says something is "COMPLEX" and you're not comfortable
- You need to set up the development environment
- You're getting errors you don't understand
- You want to make major architectural changes
- You need to modify the build system

### Resources

- **CLAUDE.md** - Technical documentation (for developers)
- **llm.txt** - AI assistant instructions (use this with AI)
- **docs/deployment.md** - Deployment guide
- **docs/migration-report.md** - Technical migration details

---

## Quick Reference Card

### Starting a Conversation

```
1. Copy llm.txt contents
2. Paste into AI assistant
3. Make your request
4. Answer clarifying questions
5. Approve the change
6. Test locally
7. Build and publish
```

### Complexity Guide

| Type | Time | Your Involvement |
|------|------|------------------|
| SIMPLE | 5-10 min | Minimal |
| MODERATE | 15-30 min | Some discussion |
| COMPLEX | 30-60 min | Detailed planning |
| RESTRICTED | N/A | Find alternative |

### Common Requests

| What You Want | How to Ask |
|---------------|------------|
| Change text | "Change [specific text] to [new text] on [page]" |
| Update colors | "Change [color element] from [current] to [new]" |
| Add section | "Add a section on [page] that says [content]" |
| Hide content | "Hide [specific section] on [page]" |
| Update image | "Replace [image name] with [new image path]" |

### Testing Checklist

- [ ] Text correct
- [ ] Colors right
- [ ] Layout good
- [ ] Mobile works
- [ ] Links functional
- [ ] Images loading

---

**Need more help?** Ask your AI assistant to read this guide and help you understand any section.

**Good luck updating your website! 🎉**
