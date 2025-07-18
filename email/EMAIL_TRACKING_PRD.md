# Product Requirements Document: Email Tracking Data Persistence Fix

## Executive Summary

The current email tracking implementation successfully serves tracking pixels but fails to persist tracking data to the Notion database in production due to serverless function lifecycle limitations. This PRD outlines a solution to ensure reliable tracking data collection.

## Problem Statement

### Current Issue
- Tracking pixels are served correctly (200 OK, proper GIF response)
- Tracking data is NOT saved to Notion database in production
- Root cause: Vercel serverless functions terminate after sending response, preventing async database writes from completing

### Impact
- No visibility into email campaign performance
- Cannot measure engagement rates
- Missing critical marketing analytics data

## Proposed Solution

Implement a **two-stage tracking system** that separates pixel serving from data persistence:

1. **Stage 1**: Tracking pixel endpoint queues events for processing
2. **Stage 2**: Separate processor handles database writes asynchronously

## Technical Requirements

### 1. Tracking Queue Implementation

#### Option A: Vercel KV (Recommended)
```javascript
// /api/track-email.js
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Serve pixel immediately
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.status(200).send(TRACKING_PIXEL);
  
  // Queue tracking event
  const trackingEvent = {
    email: deobfuscateEmail(req.query.e),
    campaign: req.query.c,
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    location: getAnonymizedLocation(req.headers)
  };
  
  await kv.lpush('email-tracking-queue', JSON.stringify(trackingEvent));
}
```

#### Option B: In-Memory Queue with Batch Processing
```javascript
// Use Edge Config or similar for temporary storage
import { get, set } from '@vercel/edge-config';

// Queue events in memory and batch process
```

### 2. Queue Processor Implementation

Create a new endpoint that processes queued tracking events:

```javascript
// /api/process-tracking-queue.js
import { kv } from '@vercel/kv';
import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  // Verify request is from authorized source (cron job or internal)
  if (req.headers['authorization'] !== process.env.QUEUE_PROCESSOR_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const notion = new Client({ auth: process.env.NOTION_TOKEN });
  const batchSize = 50;
  let processed = 0;
  
  while (processed < batchSize) {
    const event = await kv.rpop('email-tracking-queue');
    if (!event) break;
    
    const trackingData = JSON.parse(event);
    await logEmailOpen(trackingData);
    processed++;
  }
  
  res.json({ processed, remaining: await kv.llen('email-tracking-queue') });
}
```

### 3. Automated Processing

Set up Vercel Cron to process the queue every minute:

```json
// vercel.json
{
  "crons": [{
    "path": "/api/process-tracking-queue",
    "schedule": "* * * * *"
  }]
}
```

## Implementation Plan

### Phase 1: Queue Infrastructure (Week 1)
1. Set up Vercel KV storage
2. Modify tracking endpoint to queue events
3. Ensure backward compatibility

### Phase 2: Queue Processor (Week 1)
1. Create queue processing endpoint
2. Implement batch processing logic
3. Add error handling and retry logic

### Phase 3: Automation & Monitoring (Week 2)
1. Configure Vercel Cron
2. Add monitoring and alerting
3. Create queue status dashboard

### Phase 4: Testing & Deployment (Week 2)
1. Load test queue system
2. Verify data accuracy
3. Deploy to production

## Success Metrics

1. **Data Capture Rate**: 99.9% of tracking events successfully recorded
2. **Processing Latency**: Events processed within 2 minutes
3. **System Reliability**: Zero data loss over 30 days
4. **Performance Impact**: No degradation in pixel serving speed

## Alternative Solutions Considered

### 1. Vercel Edge Functions
- Pros: Better async handling
- Cons: Limited Notion SDK support, requires rewrite

### 2. External Analytics Service
- Pros: Purpose-built for tracking
- Cons: Additional cost, data sovereignty concerns

### 3. Direct Database Writes with Longer Timeouts
- Pros: Simpler implementation
- Cons: Still unreliable in serverless environment

## Risk Mitigation

1. **Queue Overflow**: Implement queue size limits and alerts
2. **Data Loss**: Add backup persistence mechanism
3. **Processing Failures**: Implement retry logic with exponential backoff
4. **Cost Management**: Monitor Vercel KV usage and set limits

## Resource Requirements

### Technical Resources
- Vercel KV addon (or alternative queue service)
- Vercel Cron (included in Pro plan)
- Development time: ~40 hours

### Cost Estimates
- Vercel KV: ~$0.15/GB/month
- Expected usage: <100MB/month
- Total additional cost: <$5/month

## Timeline

- **Week 1**: Queue implementation and processor development
- **Week 2**: Testing, monitoring setup, and deployment
- **Total Duration**: 2 weeks

## Rollout Plan

1. Deploy queue system in parallel with existing code
2. Monitor queue processing for 48 hours
3. Verify data accuracy against test emails
4. Full production rollout
5. Decommission direct database writes

## Success Criteria

- [ ] All tracking pixels continue to load successfully
- [ ] 100% of tracking events are queued
- [ ] 99.9% of queued events are processed successfully
- [ ] Email analytics dashboard shows accurate data
- [ ] No increase in pixel serving latency

## Appendix: Quick Implementation Guide

### Step 1: Enable Vercel KV
```bash
vercel env add KV_REST_API_URL
vercel env add KV_REST_API_TOKEN
```

### Step 2: Install Dependencies
```bash
npm install @vercel/kv
```

### Step 3: Update Tracking Endpoint
Replace async database writes with queue push operations.

### Step 4: Create Processor
Implement batch processing with error handling.

### Step 5: Configure Cron
Add cron configuration to vercel.json.

---

**Document Version**: 1.0  
**Date**: July 18, 2025  
**Author**: NSTCG Engineering Team  
**Status**: Ready for Review