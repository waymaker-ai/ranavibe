/**
 * LUKA Security Framework - GDPR Compliance
 * General Data Protection Regulation compliance tools
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 1. Cookie Consent Management
 */
export class CookieConsent {
  /**
   * Get user consent preferences
   */
  static getConsent(): {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
  } {
    if (typeof window === 'undefined') {
      return { necessary: true, analytics: false, marketing: false };
    }

    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      return { necessary: true, analytics: false, marketing: false };
    }

    return JSON.parse(consent);
  }

  /**
   * Set user consent preferences
   */
  static setConsent(consent: {
    necessary?: boolean;
    analytics?: boolean;
    marketing?: boolean;
  }): void {
    if (typeof window === 'undefined') return;

    const fullConsent = {
      necessary: true, // Always true
      analytics: consent.analytics ?? false,
      marketing: consent.marketing ?? false,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem('cookie_consent', JSON.stringify(fullConsent));

    // Log consent
    this.logConsent(fullConsent);
  }

  /**
   * Check if user can be tracked
   */
  static canTrack(type: 'analytics' | 'marketing'): boolean {
    const consent = this.getConsent();
    return consent[type];
  }

  /**
   * Log consent for compliance
   */
  private static async logConsent(consent: any): Promise<void> {
    await supabase.from('consent_log').insert({
      consent_data: consent,
      ip_address: null, // Get from request
      user_agent: typeof window !== 'undefined' ? navigator.userAgent : null,
      created_at: new Date().toISOString(),
    });
  }
}

/**
 * 2. Right to Access (Data Export)
 */
export class DataExport {
  /**
   * Export all user data
   */
  static async exportUserData(userId: string): Promise<any> {
    // Collect data from all tables
    const [profile, posts, comments, settings] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).single(),
      supabase.from('posts').select('*').eq('user_id', userId),
      supabase.from('comments').select('*').eq('user_id', userId),
      supabase.from('user_settings').select('*').eq('user_id', userId).single(),
    ]);

    return {
      exported_at: new Date().toISOString(),
      user_id: userId,
      profile: profile.data,
      posts: posts.data,
      comments: comments.data,
      settings: settings.data,
      // Add more tables as needed
    };
  }

  /**
   * Generate downloadable JSON file
   */
  static generateDataPackage(userData: any): Blob {
    const json = JSON.stringify(userData, null, 2);
    return new Blob([json], { type: 'application/json' });
  }

  /**
   * API route example for data export
   */
  static async handleExportRequest(userId: string): Promise<Response> {
    const data = await this.exportUserData(userId);
    const blob = this.generateDataPackage(data);

    return new Response(blob, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user-data-${userId}.json"`,
      },
    });
  }
}

/**
 * 3. Right to be Forgotten (Data Deletion)
 */
export class DataDeletion {
  /**
   * Anonymize user data (soft delete)
   */
  static async anonymizeUser(userId: string): Promise<void> {
    // Anonymize personal data but keep non-identifying info
    await supabase
      .from('profiles')
      .update({
        email: `deleted-${userId}@deleted.com`,
        name: 'Deleted User',
        avatar_url: null,
        phone: null,
        address: null,
        deleted_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    // Anonymize other tables
    await supabase
      .from('posts')
      .update({
        author_name: 'Deleted User',
      })
      .eq('user_id', userId);
  }

  /**
   * Permanently delete user data (hard delete)
   */
  static async deleteUserPermanently(userId: string): Promise<void> {
    // Delete from all tables in correct order (respect foreign keys)
    await supabase.from('comments').delete().eq('user_id', userId);
    await supabase.from('posts').delete().eq('user_id', userId);
    await supabase.from('user_settings').delete().eq('user_id', userId);
    await supabase.from('profiles').delete().eq('user_id', userId);

    // Log deletion for compliance
    await this.logDeletion(userId);
  }

  /**
   * Log deletion for compliance
   */
  private static async logDeletion(userId: string): Promise<void> {
    await supabase.from('deletion_log').insert({
      user_id: userId,
      deleted_at: new Date().toISOString(),
      reason: 'user_request',
    });
  }

  /**
   * Schedule deletion (30-day grace period)
   */
  static async scheduleDeletion(userId: string): Promise<void> {
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    await supabase.from('scheduled_deletions').insert({
      user_id: userId,
      scheduled_for: deletionDate.toISOString(),
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Cancel scheduled deletion
   */
  static async cancelDeletion(userId: string): Promise<void> {
    await supabase
      .from('scheduled_deletions')
      .delete()
      .eq('user_id', userId);
  }
}

/**
 * 4. Data Processing Agreement (DPA)
 */
export class DataProcessing {
  /**
   * Log data processing activity
   */
  static async logProcessingActivity(activity: {
    user_id?: string;
    activity_type: string;
    data_categories: string[];
    purpose: string;
    legal_basis: 'consent' | 'contract' | 'legal_obligation' | 'legitimate_interest';
    retention_period?: string;
  }): Promise<void> {
    await supabase.from('processing_activities').insert({
      ...activity,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get processing history for user
   */
  static async getProcessingHistory(userId: string): Promise<any[]> {
    const { data } = await supabase
      .from('processing_activities')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    return data || [];
  }
}

/**
 * 5. Data Retention Policies
 */
export class DataRetention {
  /**
   * Retention periods by data type
   */
  private static retentionPeriods = {
    user_profiles: 365 * 2, // 2 years after account deletion
    posts: 365 * 5, // 5 years
    comments: 365 * 5, // 5 years
    analytics: 365 * 2, // 2 years
    logs: 90, // 90 days
    consent_records: 365 * 7, // 7 years (legal requirement)
  };

  /**
   * Clean up old data based on retention policy
   */
  static async cleanupExpiredData(): Promise<void> {
    const now = new Date();

    // Delete old logs
    const logCutoff = new Date(now);
    logCutoff.setDate(logCutoff.getDate() - this.retentionPeriods.logs);

    await supabase
      .from('activity_logs')
      .delete()
      .lt('created_at', logCutoff.toISOString());

    // Delete old analytics
    const analyticsCutoff = new Date(now);
    analyticsCutoff.setDate(analyticsCutoff.getDate() - this.retentionPeriods.analytics);

    await supabase
      .from('analytics_events')
      .delete()
      .lt('created_at', analyticsCutoff.toISOString());

    // Add more cleanup for other data types
  }

  /**
   * Schedule automatic cleanup (run daily via cron)
   */
  static async scheduleCleanup(): Promise<void> {
    // This should be called by a cron job or scheduled task
    await this.cleanupExpiredData();

    console.log('Data retention cleanup completed', new Date().toISOString());
  }
}

/**
 * 6. Privacy Policy Generator
 */
export class PrivacyPolicy {
  /**
   * Generate privacy policy content
   */
  static generate(companyInfo: {
    name: string;
    email: string;
    address: string;
    dpo_email?: string;
  }): string {
    return `
# Privacy Policy

**Last Updated:** ${new Date().toLocaleDateString()}

## 1. Introduction

${companyInfo.name} ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information.

## 2. Data Controller

${companyInfo.name}
${companyInfo.address}
Email: ${companyInfo.email}
${companyInfo.dpo_email ? `DPO: ${companyInfo.dpo_email}` : ''}

## 3. Data We Collect

### Personal Data
- Name and contact information
- Email address
- Usage data and analytics
- Cookies and tracking technologies

### How We Use Your Data
- Provide and improve our services
- Communicate with you
- Comply with legal obligations
- Analyze usage patterns

## 4. Legal Basis for Processing

We process your data based on:
- **Consent**: You have given clear consent
- **Contract**: Processing is necessary for a contract
- **Legal Obligation**: Required by law
- **Legitimate Interest**: For our business interests

## 5. Your Rights

Under GDPR, you have the right to:
- **Access**: Request a copy of your data
- **Rectification**: Correct inaccurate data
- **Erasure**: Request deletion of your data
- **Restriction**: Limit processing of your data
- **Portability**: Receive your data in a portable format
- **Object**: Object to processing
- **Withdraw Consent**: At any time

## 6. Data Retention

We retain your data for as long as necessary to provide our services and comply with legal obligations.

## 7. Data Security

We implement appropriate security measures to protect your data from unauthorized access, alteration, disclosure, or destruction.

## 8. International Transfers

Your data may be transferred outside the EU. We ensure adequate safeguards are in place.

## 9. Cookies

We use cookies to improve your experience. You can manage cookie preferences in our Cookie Consent Manager.

## 10. Contact Us

For privacy-related questions:
Email: ${companyInfo.email}
${companyInfo.dpo_email ? `Data Protection Officer: ${companyInfo.dpo_email}` : ''}

## 11. Changes to This Policy

We may update this policy. Changes will be posted on this page with an updated date.
`;
  }
}

/**
 * 7. GDPR Compliance Checker
 */
export class ComplianceChecker {
  /**
   * Check GDPR compliance status
   */
  static async checkCompliance(): Promise<{
    compliant: boolean;
    issues: string[];
    warnings: string[];
  }> {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check cookie consent
    if (!CookieConsent.getConsent()) {
      issues.push('No cookie consent mechanism detected');
    }

    // Check privacy policy
    const hasPrivacyPolicy = await this.hasPrivacyPolicy();
    if (!hasPrivacyPolicy) {
      issues.push('Privacy policy not found');
    }

    // Check data export capability
    // Check data deletion capability
    // Check consent logging
    // Check data retention policies

    return {
      compliant: issues.length === 0,
      issues,
      warnings,
    };
  }

  private static async hasPrivacyPolicy(): Promise<boolean> {
    // Check if /privacy page exists
    try {
      const response = await fetch('/privacy');
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * SQL Migrations for GDPR tables
 */
export const gdprMigrations = `
-- Consent logging
CREATE TABLE IF NOT EXISTS consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  consent_data JSONB NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processing activities log
CREATE TABLE IF NOT EXISTS processing_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  activity_type TEXT NOT NULL,
  data_categories TEXT[] NOT NULL,
  purpose TEXT NOT NULL,
  legal_basis TEXT NOT NULL,
  retention_period TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deletion log (keep for compliance)
CREATE TABLE IF NOT EXISTS deletion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT
);

-- Scheduled deletions
CREATE TABLE IF NOT EXISTS scheduled_deletions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data export requests
CREATE TABLE IF NOT EXISTS data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending',
  exported_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_consent_log_user ON consent_log(user_id);
CREATE INDEX idx_processing_activities_user ON processing_activities(user_id);
CREATE INDEX idx_scheduled_deletions_date ON scheduled_deletions(scheduled_for);
`;

/**
 * Example Usage:
 *
 * // Cookie consent
 * import { CookieConsent } from '@/lib/security/gdpr';
 *
 * CookieConsent.setConsent({ analytics: true, marketing: false });
 * if (CookieConsent.canTrack('analytics')) {
 *   // Track analytics
 * }
 *
 * // Data export
 * import { DataExport } from '@/lib/security/gdpr';
 *
 * const data = await DataExport.exportUserData(userId);
 * const response = await DataExport.handleExportRequest(userId);
 *
 * // Data deletion
 * import { DataDeletion } from '@/lib/security/gdpr';
 *
 * await DataDeletion.scheduleDeletion(userId); // 30-day grace period
 * await DataDeletion.deleteUserPermanently(userId); // Immediate
 *
 * // Compliance check
 * import { ComplianceChecker } from '@/lib/security/gdpr';
 *
 * const status = await ComplianceChecker.checkCompliance();
 * console.log(status.compliant, status.issues);
 */
