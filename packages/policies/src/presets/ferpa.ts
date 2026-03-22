// ---------------------------------------------------------------------------
// FERPA preset - Family Educational Rights and Privacy Act
// Student records, directory information, consent requirements
// ---------------------------------------------------------------------------

import type { Policy } from '../types.js';
import {
  EMAIL_PATTERN,
  PHONE_PATTERN,
  SSN_PATTERN,
  DOB_PATTERN,
  ADDRESS_PATTERN,
  FULL_NAME_PATTERN,
} from '../rules/pii-rules.js';

export const ferpaPolicy: Policy = {
  metadata: {
    id: 'ferpa',
    name: 'FERPA Compliance',
    version: '1.0.0',
    description:
      'Policy enforcing Family Educational Rights and Privacy Act (20 U.S.C. 1232g; 34 CFR Part 99). ' +
      'Covers education records, directory information, consent for disclosure, legitimate educational ' +
      'interest, and parental/student rights.',
    author: 'cofounder',
    tags: ['education', 'ferpa', 'student-privacy', 'compliance', 'us-federal'],
    framework: 'FERPA',
  },
  rules: {
    pii: {
      enabled: true,
      action: 'block',
      patterns: [
        // Education records - personally identifiable information
        { ...FULL_NAME_PATTERN, action: 'block', severity: 'critical', description: 'FERPA 99.3: Student name' },
        {
          name: 'parent-name',
          pattern: '\\b(?:parent|guardian|mother|father)\\s*(?:name)?\\s*(?::|is)\\s*[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)+',
          flags: 'g',
          action: 'block',
          severity: 'critical',
          description: 'FERPA 99.3: Name of parent/guardian',
        },
        { ...ADDRESS_PATTERN, action: 'block', severity: 'critical', description: 'FERPA 99.3: Student/family address' },
        { ...SSN_PATTERN, action: 'block', severity: 'critical', description: 'FERPA 99.3: Social Security Number' },
        { ...DOB_PATTERN, action: 'block', severity: 'critical', description: 'FERPA 99.3: Date of birth' },
        { ...EMAIL_PATTERN, action: 'block', severity: 'critical', description: 'FERPA 99.3: Student email address' },
        { ...PHONE_PATTERN, action: 'block', severity: 'critical', description: 'FERPA 99.3: Student/family phone number' },
        // Student ID number
        {
          name: 'student-id',
          pattern: '\\b(?:student|pupil|learner)\\s*(?:ID|number|#|no\\.?)[\\s:]*[A-Z0-9\\-]{4,15}\\b',
          flags: 'gi',
          action: 'block',
          severity: 'critical',
          description: 'FERPA 99.3: Student identification number',
        },
        // Grades / GPA
        {
          name: 'student-grades',
          pattern: '\\b(?:GPA|grade\\s*point\\s*average|cumulative\\s*(?:GPA|average))[\\s:]*\\d+\\.\\d+',
          flags: 'gi',
          action: 'block',
          severity: 'high',
          description: 'FERPA: Grade point average (education record)',
        },
        {
          name: 'course-grade',
          pattern: '\\b(?:grade|mark|score)[\\s:]+[A-F][+\\-]?\\s+(?:in|for)\\s+[A-Z]',
          flags: 'g',
          action: 'block',
          severity: 'high',
          description: 'FERPA: Individual course grade (education record)',
        },
        // Disciplinary records
        {
          name: 'disciplinary-record',
          pattern: '\\b(?:disciplin(?:ary|e)|suspension|expulsion|probation|conduct\\s+violation)\\s+(?:record|action|hearing|report)',
          flags: 'gi',
          action: 'block',
          severity: 'critical',
          description: 'FERPA: Disciplinary record (education record)',
        },
        // Special education / IEP
        {
          name: 'special-education',
          pattern: '\\b(?:IEP|504\\s+plan|individualized\\s+education|special\\s+education|learning\\s+disabilit|accommodation\\s+plan)',
          flags: 'gi',
          action: 'block',
          severity: 'critical',
          description: 'FERPA: Special education records (IEP/504)',
        },
        // Financial aid records
        {
          name: 'financial-aid',
          pattern: '\\b(?:financial\\s+aid|FAFSA|scholarship|grant|loan)\\s+(?:record|amount|status|application)',
          flags: 'gi',
          action: 'block',
          severity: 'high',
          description: 'FERPA: Financial aid records',
        },
        // Enrollment status
        {
          name: 'enrollment-details',
          pattern: '\\b(?:enrolled|enrollment|registration)\\s+(?:status|date|in)\\s+\\w+',
          flags: 'gi',
          action: 'redact',
          severity: 'medium',
          description: 'FERPA: Enrollment information (may be directory info if designated)',
        },
        // Biometric (student photos linked to records)
        {
          name: 'student-photo',
          pattern: '\\b(?:student|pupil)\\s+(?:photo|photograph|picture|image|headshot)',
          flags: 'gi',
          action: 'block',
          severity: 'high',
          description: 'FERPA 99.3: Student photograph (PII in education record)',
        },
      ],
    },
    content: {
      enabled: true,
      prohibited: [
        {
          name: 'unauthorized-disclosure',
          pattern: '(?:share|disclose|release|provide|send)\\s+(?:student|education|school|academic)\\s+(?:records?|data|information|grades?)\\s+(?:to|with)\\s+(?:third\\s+part|external|outside|employer|company)',
          flags: 'gi',
          severity: 'critical',
          message: 'FERPA 99.30: Education records cannot be disclosed without consent except under specific exceptions',
        },
        {
          name: 'public-posting-grades',
          pattern: '(?:post|publish|display|share\\s+publicly)\\s+(?:student\\s+)?(?:grades?|scores?|GPA|results?)\\s+(?:online|publicly|on\\s+(?:the\\s+)?(?:website|board|bulletin))',
          flags: 'gi',
          severity: 'critical',
          message: 'FERPA: Public posting of student grades is prohibited',
        },
        {
          name: 'directory-info-without-notice',
          pattern: '(?:release|disclose|publish)\\s+(?:directory\\s+information)\\s+(?:without|lacking)\\s+(?:annual\\s+)?(?:notice|notification|opt[\\-\\s]?out)',
          flags: 'gi',
          severity: 'high',
          message: 'FERPA 99.37: Directory information requires annual notice and opt-out opportunity',
        },
      ],
      required: [
        {
          name: 'ferpa-notice',
          pattern: '(?:FERPA|Family\\s+Educational\\s+Rights|education(?:al)?\\s+(?:records?|privacy)|student\\s+privacy)',
          flags: 'gi',
          severity: 'medium',
          message: 'FERPA: Content involving student data should reference FERPA compliance',
        },
      ],
    },
    model: {
      enabled: true,
      allow: ['gpt-4*', 'gpt-4o*', 'o1-*', 'o3-*', 'o4-*', 'claude-*'],
      deny: ['gpt-3.5*'],
    },
    cost: {
      enabled: true,
      maxCostPerRequest: 3.0,
      maxCostPerDay: 100.0,
      maxCostPerMonth: 2000.0,
      maxTokensPerRequest: 64_000,
      maxCompletionTokens: 8_192,
    },
    data: {
      enabled: true,
      allowedCategories: ['directory-information', 'de-identified', 'aggregated', 'legitimate-educational-interest'],
      prohibitedCategories: ['raw-education-records', 'grades-with-pii', 'disciplinary-with-pii'],
      retention: {
        maxDays: 1825, // 5 years (institutional standard)
        encryptAtRest: true,
        encryptInTransit: true,
      },
      requireAuditLog: true,
      requireConsent: true,
      allowExport: true, // Parents/students have right to inspect records
      allowDeletion: false, // Institutions must maintain records
      purposes: ['educational', 'institutional-administration', 'financial-aid', 'accreditation', 'safety'],
    },
    response: {
      enabled: true,
      maxLength: 30_000,
    },
    access: {
      enabled: true,
      requireAuth: true,
      requireMFA: false,
      allowedRoles: ['teacher', 'administrator', 'registrar', 'counselor', 'financial-aid-officer', 'compliance-officer'],
      deniedRoles: ['guest', 'public', 'student-peer'],
      rateLimit: 60,
    },
  },
};
