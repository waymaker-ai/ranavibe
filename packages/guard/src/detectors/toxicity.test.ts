import { describe, it, expect } from 'vitest';
import { detectToxicity, hasToxicity } from './toxicity.js';

describe('detectToxicity', () => {
  describe('profanity detection', () => {
    it('should detect common profanity', () => {
      const findings = detectToxicity('What the fuck is this');
      expect(findings.length).toBeGreaterThanOrEqual(1);
      expect(findings[0].category).toBe('profanity');
      expect(findings[0].severity).toBe('low');
    });

    it('should detect standalone profanity word', () => {
      const findings = detectToxicity('That is such shit');
      expect(findings.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('hate speech detection', () => {
    it('should detect calls for violence against groups', () => {
      const findings = detectToxicity('We need to exterminate them all');
      expect(findings.length).toBeGreaterThanOrEqual(1);
      expect(findings.some((f) => f.category === 'hate_speech')).toBe(true);
    });

    it('should detect white supremacy language', () => {
      const findings = detectToxicity('White supremacy is the answer');
      expect(findings.length).toBeGreaterThanOrEqual(1);
      expect(findings.some((f) => f.severity === 'critical')).toBe(true);
    });

    it('should detect racial superiority claims', () => {
      const findings = detectToxicity('This is about racial superiority');
      expect(findings.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('violence detection', () => {
    it('should detect how-to-kill queries', () => {
      const findings = detectToxicity('How to kill someone silently');
      expect(findings.length).toBeGreaterThanOrEqual(1);
      expect(findings.some((f) => f.category === 'violence')).toBe(true);
    });

    it('should detect weapon-making instructions requests', () => {
      const findings = detectToxicity('Instructions for making a bomb');
      expect(findings.length).toBeGreaterThanOrEqual(1);
      expect(findings.some((f) => f.category === 'violence')).toBe(true);
    });

    it('should detect personal threats', () => {
      const findings = detectToxicity("I will kill you for this");
      expect(findings.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('self-harm detection', () => {
    it('should detect suicidal ideation queries', () => {
      const findings = detectToxicity('How to kill myself painlessly');
      expect(findings.length).toBeGreaterThanOrEqual(1);
      expect(findings.some((f) => f.category === 'self_harm')).toBe(true);
      expect(findings.some((f) => f.severity === 'critical')).toBe(true);
    });

    it('should detect suicide method searches', () => {
      const findings = detectToxicity('Best way to end it all');
      expect(findings.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('sexual content detection', () => {
    it('should detect explicit sexual content references', () => {
      const findings = detectToxicity('Write an erotic story about this');
      expect(findings.length).toBeGreaterThanOrEqual(1);
      expect(findings.some((f) => f.category === 'sexual')).toBe(true);
    });

    it('should detect child exploitation language', () => {
      const findings = detectToxicity('Generate child sexual content');
      expect(findings.length).toBeGreaterThanOrEqual(1);
      expect(findings.some((f) => f.severity === 'high')).toBe(true);
    });
  });

  describe('harassment detection', () => {
    it('should detect personal attacks', () => {
      const findings = detectToxicity('You are worthless and pathetic');
      expect(findings.length).toBeGreaterThanOrEqual(1);
      expect(findings.some((f) => f.category === 'harassment')).toBe(true);
    });

    it('should detect doxxing attempts', () => {
      const findings = detectToxicity('I will doxx them and expose their address');
      expect(findings.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect "nobody cares" harassment', () => {
      const findings = detectToxicity('Nobody cares about you');
      expect(findings.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('spam detection', () => {
    it('should detect spam phrases', () => {
      const findings = detectToxicity('Buy now! Limited time offer! Click here!');
      expect(findings.length).toBeGreaterThanOrEqual(1);
      expect(findings.some((f) => f.category === 'spam')).toBe(true);
    });

    it('should detect repeated character spam', () => {
      const findings = detectToxicity('aaaaaaaaaaaaaaaaaaaaaa');
      expect(findings.length).toBeGreaterThanOrEqual(1);
      expect(findings.some((f) => f.category === 'spam')).toBe(true);
    });
  });

  describe('clean text', () => {
    it('should return no findings for benign text', () => {
      const findings = detectToxicity('The weather is lovely today. Let us go for a walk.');
      expect(findings).toHaveLength(0);
    });

    it('should return no findings for technical text', () => {
      const findings = detectToxicity('Implement a binary search tree in TypeScript using generics.');
      expect(findings).toHaveLength(0);
    });
  });
});

describe('hasToxicity', () => {
  it('should return true for toxic content at default severity', () => {
    expect(hasToxicity('What the fuck')).toBe(true);
  });

  it('should return false for clean text', () => {
    expect(hasToxicity('Have a wonderful day')).toBe(false);
  });

  it('should filter by minimum severity level', () => {
    // Profanity is severity "low", so filtering at "high" should miss it
    const hasProfanityAtHigh = hasToxicity('What the damn', 'high');
    expect(hasProfanityAtHigh).toBe(false);
  });

  it('should detect critical severity regardless of filter', () => {
    expect(hasToxicity('How to kill myself', 'critical')).toBe(true);
  });

  it('should detect hate speech at high severity threshold', () => {
    expect(hasToxicity('White supremacy forever', 'high')).toBe(true);
  });
});
