// No hashing - store emails directly

// Helper to validate UK postcode
function isValidPostcode(postcode) {
  const postcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
  return postcodeRegex.test(postcode.trim());
}

export default async function handler(req, res) {
  console.log('[CampaignForm] Request received:', req.method, req.url);
  console.log('[CampaignForm] Request headers:', JSON.stringify(req.headers, null, 2));
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log('[CampaignForm] Handling OPTIONS preflight request');
    return res.status(200).end();
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    console.log('[CampaignForm] Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('[CampaignForm] Processing POST request');

  try {
    console.log('[CampaignForm] Request body:', JSON.stringify(req.body, null, 2));
    
    // Extract form data
    const {
      voterName,
      voterEmail,
      voterPostcode,
      votingPriority,
      voterMessage,
      voteCommitment,
      pageSource = 'unknown',
      submittedAt = new Date().toISOString()
    } = req.body;

    console.log('[CampaignForm] Extracted form data:', {
      voterName,
      voterEmail: voterEmail ? voterEmail.substring(0, 3) + '***' : null, // Partial log for privacy
      voterPostcode,
      votingPriority,
      hasMessage: !!voterMessage,
      voteCommitment,
      pageSource,
      submittedAt
    });

    // Validate required fields
    if (!voterName || !voterEmail || !voterPostcode || !votingPriority) {
      console.error('[CampaignForm] Validation failed: Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Name, email, postcode, and voting priority are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(voterEmail)) {
      console.error('[CampaignForm] Validation failed: Invalid email format');
      return res.status(400).json({ 
        error: 'Invalid email format'
      });
    }
    console.log('[CampaignForm] Email validation passed');

    // Validate UK postcode
    if (!isValidPostcode(voterPostcode)) {
      console.error('[CampaignForm] Validation failed: Invalid postcode:', voterPostcode);
      return res.status(400).json({ 
        error: 'Invalid UK postcode format'
      });
    }
    console.log('[CampaignForm] Postcode validation passed');

    // Validate commitment checkbox
    if (!voteCommitment) {
      console.error('[CampaignForm] Validation failed: Vote commitment not confirmed');
      return res.status(400).json({ 
        error: 'Vote commitment must be confirmed'
      });
    }
    console.log('[CampaignForm] All validations passed');

    // Get IP for tracking
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress;
    const cleanIP = ip.split(',')[0].trim();
    console.log('[CampaignForm] IP address:', cleanIP);

    // Prepare data for Notion
    const campaignData = {
      // Personal info
      name: voterName.trim(),
      email: voterEmail.toLowerCase().trim(),
      postcode: voterPostcode.toUpperCase().replace(/\s+/g, ''), // Normalize postcode
      
      // Voting intention
      votingPriority: votingPriority,
      message: voterMessage || '',
      commitment: voteCommitment,
      
      // Meta data
      pageSource: pageSource,
      submittedAt: submittedAt,
      ipAddress: cleanIP,
      
      // Campaign tracking
      campaignName: 'Final Countdown',
      formType: 'vote-commitment'
    };

    console.log('[CampaignForm] Prepared campaign data:', {
      ...campaignData,
      email: campaignData.email.substring(0, 3) + '***', // Privacy
      ipAddress: campaignData.ipAddress.substring(0, 3) + '***' // Privacy
    });

    // Send to Notion
    console.log('[CampaignForm] Sending to Notion database:', process.env.NOTION_CAMPAIGN_FORMS_DB_ID);
    
    const notionPayload = {
      parent: {
        database_id: process.env.NOTION_CAMPAIGN_FORMS_DB_ID
      },
      properties: {
        'Name': {
          title: [{
            text: { content: campaignData.name }
          }]
        },
        'Email': {
          email: campaignData.email
        },
        'Postcode': {
          rich_text: [{
            text: { content: campaignData.postcode }
          }]
        },
        'Voting Priority': {
          select: { name: campaignData.votingPriority }
        },
        'Message': {
          rich_text: [{
            text: { content: campaignData.message.substring(0, 2000) }
          }]
        },
        'Vote Commitment': {
          checkbox: campaignData.commitment
        },
        'Submitted At': {
          date: { start: campaignData.submittedAt }
        }
      }
    };

    console.log('[CampaignForm] Notion payload prepared');

    const notionResponse = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify(notionPayload)
    });

    console.log('[CampaignForm] Notion API response status:', notionResponse.status);

    if (!notionResponse.ok) {
      const error = await notionResponse.json();
      console.error('[CampaignForm] Notion API error:', JSON.stringify(error, null, 2));
      throw new Error('Failed to save to Notion');
    }

    const notionResult = await notionResponse.json();
    console.log('[CampaignForm] Successfully created Notion page:', notionResult.id);

    // Return success response
    const successResponse = {
      success: true,
      message: 'Thank you for your commitment to vote for change!',
      data: {
        name: campaignData.name,
        priority: campaignData.votingPriority,
        commitment: true
      }
    };
    
    console.log('[CampaignForm] Sending success response:', successResponse);
    res.status(200).json(successResponse);

  } catch (error) {
    console.error('[CampaignForm] Campaign form submission error:', error);
    console.error('[CampaignForm] Error stack:', error.stack);
    
    const errorResponse = {
      success: false,
      error: 'Failed to process your submission. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
    
    console.log('[CampaignForm] Sending error response:', errorResponse);
    res.status(500).json(errorResponse);
  }
}