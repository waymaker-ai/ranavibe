/**
 * RANA Email Plugin Example
 * Demonstrates AI-powered email processing
 */

import { RanaClient, createEmailPlugin } from '@rana/core';

// ============================================================================
// Example 1: Gmail Integration with Auto-Classification
// ============================================================================

async function gmailExample() {
  // Create RANA client
  const rana = new RanaClient({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY!,
    },
  });

  // Create email plugin with Gmail
  const emailPlugin = createEmailPlugin({
    provider: 'gmail',
    credentials: {
      gmail: {
        clientId: process.env.GMAIL_CLIENT_ID!,
        clientSecret: process.env.GMAIL_CLIENT_SECRET!,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN!,
      },
    },
    pollingInterval: 60000, // Check every minute
    autoClassify: true,
    llmProvider: 'anthropic',
    llmModel: 'claude-3-5-sonnet-20241022',
  });

  // Connect RANA client
  emailPlugin.setRanaClient(rana);

  // Connect to Gmail
  await emailPlugin.connect();

  // Handle incoming emails
  emailPlugin.onEmail(async (email) => {
    console.log(`\n📧 New email from ${email.from.address}`);
    console.log(`Subject: ${email.subject}`);

    // Classify the email
    const classification = await emailPlugin.classify(email);
    console.log(`Category: ${classification.category}`);
    console.log(`Priority: ${classification.priority}`);
    console.log(`Requires response: ${classification.requiresResponse}`);

    // Auto-respond to high priority emails
    if (classification.priority === 'high' && classification.requiresResponse) {
      const reply = await emailPlugin.generateReply(email, {
        tone: 'professional',
        instructions: 'Acknowledge receipt and provide estimated response time',
      });

      console.log('\n📤 Generated reply:');
      console.log(reply.body.text);

      // Optionally send the reply
      // await emailPlugin.send(
      //   reply.to,
      //   reply.subject,
      //   reply.body
      // );
    }

    // Detect spam
    if (classification.isSpam) {
      console.log('⚠️  Spam detected!');
    }
  });

  console.log('✅ Email plugin started. Monitoring for new emails...');
}

// ============================================================================
// Example 2: IMAP/SMTP Integration
// ============================================================================

async function imapExample() {
  const rana = new RanaClient({
    providers: {
      openai: process.env.OPENAI_API_KEY!,
    },
  });

  const emailPlugin = createEmailPlugin({
    provider: 'imap',
    credentials: {
      imap: {
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER!,
          pass: process.env.EMAIL_PASS!,
        },
      },
      smtp: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER!,
          pass: process.env.EMAIL_PASS!,
        },
      },
    },
    filters: {
      // Only process emails from specific senders
      from: ['support@example.com', 'sales@example.com'],
      // Only emails with attachments
      hasAttachment: true,
    },
  });

  emailPlugin.setRanaClient(rana);
  await emailPlugin.connect();

  console.log('✅ IMAP/SMTP plugin connected');
}

// ============================================================================
// Example 3: Email Thread Summarization
// ============================================================================

async function threadSummaryExample() {
  const rana = new RanaClient({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY!,
    },
  });

  const emailPlugin = createEmailPlugin({
    provider: 'gmail',
    credentials: {
      gmail: {
        clientId: process.env.GMAIL_CLIENT_ID!,
        clientSecret: process.env.GMAIL_CLIENT_SECRET!,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN!,
      },
    },
  });

  emailPlugin.setRanaClient(rana);
  await emailPlugin.connect();

  // Fetch emails from a specific thread
  const emails = await emailPlugin.fetch(
    {
      subject: 'Project Update',
      dateAfter: new Date('2024-01-01'),
    },
    50
  );

  if (emails.length > 0) {
    // Summarize the entire thread
    const summary = await emailPlugin.summarize(emails);

    console.log('\n📊 Email Thread Summary');
    console.log('='.repeat(50));
    console.log(`Subject: ${summary.subject}`);
    console.log(`Emails: ${summary.emailCount}`);
    console.log(`Participants: ${summary.participants.length}`);
    console.log(`Sentiment: ${summary.sentiment}`);
    console.log('\n🔑 Key Points:');
    summary.keyPoints.forEach((point, i) => {
      console.log(`  ${i + 1}. ${point}`);
    });

    if (summary.actionItems && summary.actionItems.length > 0) {
      console.log('\n✅ Action Items:');
      summary.actionItems.forEach((item, i) => {
        console.log(`  ${i + 1}. ${item}`);
      });
    }
  }

  await emailPlugin.disconnect();
}

// ============================================================================
// Example 4: Smart Email Filtering and Routing
// ============================================================================

async function smartRoutingExample() {
  const rana = new RanaClient({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY!,
    },
  });

  const emailPlugin = createEmailPlugin({
    provider: 'outlook',
    credentials: {
      outlook: {
        clientId: process.env.OUTLOOK_CLIENT_ID!,
        clientSecret: process.env.OUTLOOK_CLIENT_SECRET!,
        tenantId: process.env.OUTLOOK_TENANT_ID!,
        refreshToken: process.env.OUTLOOK_REFRESH_TOKEN!,
      },
    },
    autoClassify: true,
  });

  emailPlugin.setRanaClient(rana);
  await emailPlugin.connect();

  emailPlugin.onEmail(async (email) => {
    const classification = await emailPlugin.classify(email);

    // Route based on category
    switch (classification.category) {
      case 'work':
        console.log(`📋 Work email: ${email.subject}`);
        // Forward to work queue
        break;

      case 'promotional':
        console.log(`🏷️  Promotional email: ${email.subject}`);
        // Archive or delete
        break;

      case 'personal':
        console.log(`💌 Personal email: ${email.subject}`);
        // Keep in inbox
        break;

      case 'spam':
        console.log(`🗑️  Spam email: ${email.subject}`);
        // Move to spam folder
        break;

      default:
        console.log(`📨 Other email: ${email.subject}`);
    }

    // Handle urgent emails immediately
    if (classification.priority === 'urgent') {
      console.log('🚨 URGENT EMAIL DETECTED!');
      // Send notification, create task, etc.
    }
  });
}

// ============================================================================
// Example 5: Batch Email Analysis
// ============================================================================

async function batchAnalysisExample() {
  const rana = new RanaClient({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY!,
    },
    defaults: {
      optimize: 'cost', // Use cost optimization for batch processing
    },
  });

  const emailPlugin = createEmailPlugin({
    provider: 'gmail',
    credentials: {
      gmail: {
        clientId: process.env.GMAIL_CLIENT_ID!,
        clientSecret: process.env.GMAIL_CLIENT_SECRET!,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN!,
      },
    },
  });

  emailPlugin.setRanaClient(rana);
  await emailPlugin.connect();

  // Fetch last 100 emails
  const emails = await emailPlugin.fetch(undefined, 100);

  console.log(`\n📊 Analyzing ${emails.length} emails...`);

  // Classify all emails
  const classifications = await Promise.all(
    emails.map((email) => emailPlugin.classify(email))
  );

  // Generate statistics
  const stats = {
    total: emails.length,
    byCategory: {} as Record<string, number>,
    byPriority: {} as Record<string, number>,
    spam: 0,
    requiresResponse: 0,
  };

  classifications.forEach((classification) => {
    stats.byCategory[classification.category] =
      (stats.byCategory[classification.category] || 0) + 1;
    stats.byPriority[classification.priority] =
      (stats.byPriority[classification.priority] || 0) + 1;
    if (classification.isSpam) stats.spam++;
    if (classification.requiresResponse) stats.requiresResponse++;
  });

  console.log('\n📈 Email Statistics:');
  console.log(`Total emails: ${stats.total}`);
  console.log(`\nBy Category:`);
  Object.entries(stats.byCategory).forEach(([category, count]) => {
    console.log(`  ${category}: ${count}`);
  });
  console.log(`\nBy Priority:`);
  Object.entries(stats.byPriority).forEach(([priority, count]) => {
    console.log(`  ${priority}: ${count}`);
  });
  console.log(`\nSpam: ${stats.spam}`);
  console.log(`Requires response: ${stats.requiresResponse}`);

  await emailPlugin.disconnect();
}

// ============================================================================
// Example 6: Custom Email Generation
// ============================================================================

async function customEmailExample() {
  const rana = new RanaClient({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY!,
    },
  });

  const emailPlugin = createEmailPlugin({
    provider: 'gmail',
    credentials: {
      gmail: {
        clientId: process.env.GMAIL_CLIENT_ID!,
        clientSecret: process.env.GMAIL_CLIENT_SECRET!,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN!,
      },
    },
  });

  emailPlugin.setRanaClient(rana);
  await emailPlugin.connect();

  // Send a simple email
  await emailPlugin.send(
    'recipient@example.com',
    'Meeting Reminder',
    'Hi! Just a reminder about our meeting tomorrow at 2 PM.'
  );

  // Send email with attachments
  await emailPlugin.send(
    { address: 'team@example.com', name: 'Development Team' },
    'Weekly Report',
    {
      text: 'Please find the weekly report attached.',
      html: '<p>Please find the <strong>weekly report</strong> attached.</p>',
    },
    {
      attachments: [
        {
          filename: 'report.pdf',
          contentType: 'application/pdf',
          size: 12345,
          data: Buffer.from('...'), // PDF data
        },
      ],
    }
  );

  console.log('✅ Emails sent successfully');

  await emailPlugin.disconnect();
}

// ============================================================================
// Run Examples
// ============================================================================

async function main() {
  console.log('RANA Email Plugin Examples\n');

  // Uncomment the example you want to run:

  // await gmailExample();
  // await imapExample();
  // await threadSummaryExample();
  // await smartRoutingExample();
  // await batchAnalysisExample();
  // await customEmailExample();

  console.log('\nNote: Uncomment an example function in main() to run it.');
}

main().catch(console.error);
