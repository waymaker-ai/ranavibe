// ---------------------------------------------------------------------------
// Content filtering patterns
// ---------------------------------------------------------------------------

import type { ContentPattern } from '../types.js';

// ----- Prohibited patterns -------------------------------------------------

export const HARMFUL_INSTRUCTIONS: ContentPattern = {
  name: 'harmful-instructions',
  pattern:
    '(?:how\\s+to\\s+(?:make|build|create|manufacture|synthesize)\\s+(?:a\\s+)?(?:bomb|explosive|weapon|poison|drug|meth|fentanyl))',
  flags: 'gi',
  severity: 'critical',
  message: 'Content contains instructions for creating harmful substances or weapons',
};

export const SUICIDE_SELF_HARM: ContentPattern = {
  name: 'suicide-self-harm',
  pattern:
    '(?:(?:how\\s+to|ways\\s+to|methods?\\s+(?:to|of|for))\\s+(?:kill\\s+(?:your|my|one)self|commit\\s+suicide|self[\\-\\s]harm|end\\s+(?:your|my|one\\.?s?)\\s+life))',
  flags: 'gi',
  severity: 'critical',
  message: 'Content contains self-harm or suicide instructions',
};

export const CHILD_EXPLOITATION: ContentPattern = {
  name: 'child-exploitation',
  pattern:
    '(?:child\\s+(?:porn(?:ography)?|exploitation|abuse\\s+(?:material|image|video))|CSAM|minor\\s+(?:sexual|nude|explicit))',
  flags: 'gi',
  severity: 'critical',
  message: 'Content references child exploitation material',
};

export const VIOLENCE_THREATS: ContentPattern = {
  name: 'violence-threats',
  pattern:
    '(?:(?:i\\s+will|i\'m\\s+going\\s+to|gonna|going\\s+to)\\s+(?:kill|murder|shoot|stab|bomb|attack|assault)\\s+)',
  flags: 'gi',
  severity: 'critical',
  message: 'Content contains violent threats',
};

export const ILLEGAL_ACTIVITY: ContentPattern = {
  name: 'illegal-activity',
  pattern:
    '(?:how\\s+to\\s+(?:hack\\s+into|break\\s+into|steal|forge|counterfeit|launder\\s+money|evade\\s+taxes|traffic))',
  flags: 'gi',
  severity: 'high',
  message: 'Content contains instructions for illegal activities',
};

export const HATE_SPEECH: ContentPattern = {
  name: 'hate-speech',
  pattern:
    '(?:(?:all|every|those)\\s+(?:jews|muslims|blacks|whites|asians|hispanics|gays|lesbians|trans(?:gender)?\\s+(?:people)?)\\s+(?:should|must|need\\s+to|deserve\\s+to)\\s+(?:die|be\\s+(?:killed|eliminated|removed|deported)))',
  flags: 'gi',
  severity: 'critical',
  message: 'Content contains hate speech targeting protected groups',
};

export const DOXXING: ContentPattern = {
  name: 'doxxing',
  pattern:
    '(?:(?:home\\s+address|phone\\s+number|social\\s+security|personal\\s+(?:info|information|details))\\s+(?:of|for|about)\\s+[A-Z][a-z]+)',
  flags: 'g',
  severity: 'high',
  message: 'Content may contain doxxing or personal information disclosure',
};

export const MISINFORMATION_MEDICAL: ContentPattern = {
  name: 'misinformation-medical',
  pattern:
    '(?:(?:vaccines?|vaccination)\\s+(?:cause|causes|causing)\\s+(?:autism|infertility|death|cancer)|(?:bleach|ivermectin|hydroxychloroquine)\\s+(?:cures?|treats?|prevents?)\\s+(?:covid|cancer|aids|hiv))',
  flags: 'gi',
  severity: 'high',
  message: 'Content contains medical misinformation',
};

export const JAILBREAK_ATTEMPT: ContentPattern = {
  name: 'jailbreak-attempt',
  pattern:
    '(?:ignore\\s+(?:all\\s+)?(?:previous|prior|above)\\s+(?:instructions?|prompts?|rules?|guidelines?)|(?:you\\s+are\\s+now|act\\s+as|pretend\\s+(?:to\\s+be|you\\s+are))\\s+(?:DAN|evil|unrestricted|unfiltered|jailbroken))',
  flags: 'gi',
  severity: 'high',
  message: 'Content contains a jailbreak or prompt injection attempt',
};

export const PROMPT_INJECTION: ContentPattern = {
  name: 'prompt-injection',
  pattern:
    '(?:system\\s*:\\s*you\\s+are|\\[INST\\]|<\\|im_start\\|>|<<SYS>>|ADMIN\\s*OVERRIDE|DEVELOPER\\s*MODE\\s*(?:ENABLED|ON))',
  flags: 'gi',
  severity: 'high',
  message: 'Content contains a prompt injection attempt',
};

// ----- Required patterns (disclaimers, notices, etc.) ----------------------

export const INVESTMENT_DISCLAIMER: ContentPattern = {
  name: 'investment-disclaimer',
  pattern:
    '(?:not\\s+(?:financial|investment)\\s+advice|past\\s+performance\\s+(?:is\\s+)?(?:not|no)\\s+(?:guarantee|indicat(?:or|ive)))',
  flags: 'gi',
  severity: 'medium',
  message: 'Financial/investment content must include a disclaimer',
};

export const MEDICAL_DISCLAIMER: ContentPattern = {
  name: 'medical-disclaimer',
  pattern:
    '(?:not\\s+(?:medical|health)\\s+advice|consult\\s+(?:a|your)\\s+(?:doctor|physician|healthcare\\s+(?:provider|professional)))',
  flags: 'gi',
  severity: 'medium',
  message: 'Medical content must include a disclaimer to consult a healthcare professional',
};

export const LEGAL_DISCLAIMER: ContentPattern = {
  name: 'legal-disclaimer',
  pattern:
    '(?:not\\s+legal\\s+advice|consult\\s+(?:a|an|your)\\s+(?:lawyer|attorney|legal\\s+(?:professional|counsel)))',
  flags: 'gi',
  severity: 'medium',
  message: 'Legal content must include a disclaimer to consult a legal professional',
};

export const AI_DISCLOSURE: ContentPattern = {
  name: 'ai-disclosure',
  pattern:
    '(?:generated\\s+by\\s+(?:an?\\s+)?(?:AI|artificial\\s+intelligence|language\\s+model)|AI[\\-\\s]generated|this\\s+(?:response|content)\\s+(?:was|is)\\s+(?:generated|produced|created)\\s+(?:by|using)\\s+(?:an?\\s+)?AI)',
  flags: 'gi',
  severity: 'low',
  message: 'AI-generated content should include an AI disclosure',
};

// ----- Aggregated lists ----------------------------------------------------

export const SAFETY_PROHIBITED_PATTERNS: ContentPattern[] = [
  HARMFUL_INSTRUCTIONS,
  SUICIDE_SELF_HARM,
  CHILD_EXPLOITATION,
  VIOLENCE_THREATS,
  ILLEGAL_ACTIVITY,
  HATE_SPEECH,
  DOXXING,
  MISINFORMATION_MEDICAL,
  JAILBREAK_ATTEMPT,
  PROMPT_INJECTION,
];

export const FINANCIAL_REQUIRED_PATTERNS: ContentPattern[] = [
  INVESTMENT_DISCLAIMER,
];

export const MEDICAL_REQUIRED_PATTERNS: ContentPattern[] = [
  MEDICAL_DISCLAIMER,
];

export const LEGAL_REQUIRED_PATTERNS: ContentPattern[] = [
  LEGAL_DISCLAIMER,
];
