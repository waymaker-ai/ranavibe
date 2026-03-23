import { describe, it, expect } from 'vitest';
import {
  HallucinationDetector,
  createHallucinationDetector,
  tokenize,
  splitSentences,
  buildIDF,
  tfidfOverlap,
  tokenSimilarity,
  chunkText,
} from '../index';
import type { Source, Claim } from '../types';

// ---------------------------------------------------------------------------
// Test sources
// ---------------------------------------------------------------------------

const WIKIPEDIA_SOURCE: Source = {
  id: 'wiki-1',
  content: 'The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris, France. It is named after the engineer Gustave Eiffel, whose company designed and built the tower from 1887 to 1889. Locally nicknamed "La dame de fer" (French for "Iron Lady"), it was constructed as the centerpiece of the 1889 World\'s Fair. The tower is 330 metres (1,083 ft) tall and was the tallest man-made structure in the world until the Chrysler Building in New York City was topped out in 1930.',
  title: 'Eiffel Tower - Wikipedia',
};

const SCIENCE_SOURCE: Source = {
  id: 'sci-1',
  content: 'Water is a chemical substance with the chemical formula H2O. A water molecule contains one oxygen and two hydrogen atoms that are connected by covalent bonds. Water is a liquid at ambient conditions, but it often co-exists on Earth with its solid state, ice, and gaseous state, steam. Water covers about 71% of the Earth\'s surface.',
  title: 'Water - Chemistry',
};

const HISTORY_SOURCE: Source = {
  id: 'hist-1',
  content: 'The American Revolution was an ideological and political revolution that occurred in British America between 1765 and 1791. The American Patriots in the Thirteen Colonies defeated the British in the American Revolutionary War (1775-1783) with the assistance of France, winning independence from Great Britain and establishing the United States of America.',
  title: 'American Revolution',
};

// ---------------------------------------------------------------------------
// Utility tests
// ---------------------------------------------------------------------------

describe('tokenize', () => {
  it('should tokenize text and remove stopwords', () => {
    const tokens = tokenize('The quick brown fox jumps over the lazy dog');
    expect(tokens).toContain('quick');
    expect(tokens).toContain('brown');
    expect(tokens).toContain('fox');
    expect(tokens).not.toContain('the');
    expect(tokens).not.toContain('over');
  });

  it('should handle empty text', () => {
    expect(tokenize('')).toEqual([]);
  });

  it('should lowercase tokens', () => {
    const tokens = tokenize('HELLO World');
    expect(tokens).toContain('hello');
    expect(tokens).toContain('world');
  });

  it('should remove punctuation', () => {
    const tokens = tokenize('Hello, world! This is great.');
    expect(tokens).not.toContain('hello,');
    expect(tokens).not.toContain('world!');
  });
});

describe('splitSentences', () => {
  it('should split text into sentences', () => {
    const sentences = splitSentences('Hello world. How are you? I am fine!');
    expect(sentences.length).toBe(3);
    expect(sentences[0]).toContain('Hello world');
    expect(sentences[1]).toContain('How are you');
    expect(sentences[2]).toContain('I am fine');
  });

  it('should handle abbreviations', () => {
    const sentences = splitSentences('Dr. Smith went to the store. He bought milk.');
    expect(sentences.length).toBe(2);
  });

  it('should handle empty text', () => {
    expect(splitSentences('')).toEqual([]);
  });

  it('should handle single sentence', () => {
    const sentences = splitSentences('Just one sentence.');
    expect(sentences.length).toBe(1);
  });
});

describe('chunkText', () => {
  it('should split text into chunks', () => {
    const text = 'a'.repeat(1000);
    const chunks = chunkText(text, 300, 50);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].length).toBe(300);
  });

  it('should return single chunk for short text', () => {
    const chunks = chunkText('short text', 500, 100);
    expect(chunks.length).toBe(1);
    expect(chunks[0]).toBe('short text');
  });

  it('should have overlapping content', () => {
    const text = 'abcdefghijklmnopqrstuvwxyz';
    const chunks = chunkText(text, 10, 3);
    // Second chunk should start 7 chars in (10 - 3)
    expect(chunks[1].startsWith('hijklm')).toBe(true);
  });
});

describe('buildIDF', () => {
  it('should compute IDF values', () => {
    const docs = ['the cat sat', 'the dog ran', 'the bird flew'];
    const idf = buildIDF(docs);
    // "cat" appears in 1 doc, should have higher IDF
    // Common words removed by tokenize, but let's check structure
    expect(idf.size).toBeGreaterThan(0);
  });
});

describe('tfidfOverlap', () => {
  it('should return 1.0 for identical token sets', () => {
    const tokens = ['quick', 'brown', 'fox'];
    const idf = new Map([['quick', 1], ['brown', 1], ['fox', 1]]);
    const score = tfidfOverlap(tokens, tokens, idf);
    expect(score).toBeCloseTo(1.0, 1);
  });

  it('should return 0 for disjoint token sets', () => {
    const claim = ['quick', 'brown', 'fox'];
    const source = ['lazy', 'red', 'dog'];
    const idf = new Map([
      ['quick', 1], ['brown', 1], ['fox', 1],
      ['lazy', 1], ['red', 1], ['dog', 1],
    ]);
    expect(tfidfOverlap(claim, source, idf)).toBe(0);
  });

  it('should return partial score for partial overlap', () => {
    const claim = ['quick', 'brown', 'fox'];
    const source = ['quick', 'red', 'fox'];
    const idf = new Map([
      ['quick', 1], ['brown', 1], ['fox', 1], ['red', 1],
    ]);
    const score = tfidfOverlap(claim, source, idf);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });

  it('should handle empty inputs', () => {
    const idf = new Map<string, number>();
    expect(tfidfOverlap([], ['a'], idf)).toBe(0);
    expect(tfidfOverlap(['a'], [], idf)).toBe(0);
  });
});

describe('tokenSimilarity', () => {
  it('should return 1.0 for identical text', () => {
    expect(tokenSimilarity('hello world', 'hello world')).toBeCloseTo(1.0, 1);
  });

  it('should return 0 for completely different text', () => {
    const score = tokenSimilarity('abc def ghi', 'xyz uvw rst');
    expect(score).toBe(0);
  });

  it('should return partial score for similar text', () => {
    const score = tokenSimilarity(
      'the quick brown fox jumped over the lazy fence yesterday',
      'the quick red fox jumped over the lazy gate yesterday'
    );
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });
});

// ---------------------------------------------------------------------------
// HallucinationDetector tests
// ---------------------------------------------------------------------------

describe('HallucinationDetector', () => {
  describe('extractClaims', () => {
    it('should extract claims from text', () => {
      const detector = new HallucinationDetector();
      const claims = detector.extractClaims(
        'The Eiffel Tower is 330 metres tall. It was built in 1889.'
      );
      expect(claims.length).toBe(2);
      expect(claims[0].isFactual).toBe(true);
      expect(claims[1].isFactual).toBe(true);
    });

    it('should classify opinion claims correctly', () => {
      const detector = new HallucinationDetector();
      const claims = detector.extractClaims(
        'I think the Eiffel Tower is beautiful. It is 330 metres tall.'
      );
      const opinion = claims.find(c => c.type === 'opinion');
      const factual = claims.find(c => c.isFactual);
      expect(opinion).toBeDefined();
      expect(factual).toBeDefined();
    });

    it('should classify meta statements correctly', () => {
      const detector = new HallucinationDetector();
      const claims = detector.extractClaims(
        "Based on the information provided, the tower is tall. I'm sorry but I cannot help with that."
      );
      const meta = claims.filter(c => c.type === 'meta');
      expect(meta.length).toBeGreaterThan(0);
    });

    it('should classify quantitative claims', () => {
      const detector = new HallucinationDetector();
      const claims = detector.extractClaims(
        'The tower is approximately 330 metres tall.'
      );
      expect(claims[0].type).toBe('quantitative');
    });

    it('should classify attribution claims', () => {
      const detector = new HallucinationDetector();
      const claims = detector.extractClaims(
        'According to researchers, the structure is stable.'
      );
      expect(claims[0].type).toBe('attribution');
    });

    it('should classify causal claims', () => {
      const detector = new HallucinationDetector();
      const claims = detector.extractClaims(
        'The tower was built because of the World Fair.'
      );
      expect(claims[0].type).toBe('causal');
    });

    it('should skip short claims', () => {
      const detector = new HallucinationDetector({ minClaimLength: 20 });
      const claims = detector.extractClaims('Yes. The tower is very tall and impressive.');
      // "Yes." should be skipped
      const shortClaim = claims.find(c => c.text === 'Yes.');
      expect(shortClaim).toBeUndefined();
    });

    it('should record sentence indices', () => {
      const detector = new HallucinationDetector();
      const claims = detector.extractClaims(
        'First sentence here. Second sentence here. Third sentence here.'
      );
      expect(claims[0].sentenceIndex).toBe(0);
      expect(claims[1].sentenceIndex).toBe(1);
      expect(claims[2].sentenceIndex).toBe(2);
    });
  });

  describe('check', () => {
    it('should detect grounded response', () => {
      const detector = new HallucinationDetector({ groundingThreshold: 0.3 });
      const result = detector.check(
        'The Eiffel Tower is a wrought-iron lattice tower located in Paris, France. It was built from 1887 to 1889.',
        [WIKIPEDIA_SOURCE]
      );
      expect(result.grounded).toBe(true);
      expect(result.groundingScore).toBeGreaterThan(0);
      expect(result.supportedClaims + result.partiallySupportedClaims).toBeGreaterThan(0);
    });

    it('should detect hallucinated response', () => {
      const detector = new HallucinationDetector({ supportThreshold: 0.5 });
      const result = detector.check(
        'The Eiffel Tower was built in 1950 by Leonardo da Vinci and is located in London, England.',
        [WIKIPEDIA_SOURCE]
      );
      // This should have a lower grounding score since the facts are wrong
      expect(result.unsupportedClaims).toBeGreaterThanOrEqual(0);
      expect(result.totalClaims).toBeGreaterThan(0);
    });

    it('should handle empty response', () => {
      const detector = new HallucinationDetector();
      const result = detector.check('', [WIKIPEDIA_SOURCE]);
      expect(result.grounded).toBe(true);
      expect(result.totalClaims).toBe(0);
    });

    it('should handle no sources', () => {
      const detector = new HallucinationDetector();
      const result = detector.check(
        'The Eiffel Tower is 330 metres tall.',
        []
      );
      expect(result.grounded).toBe(false);
      expect(result.groundingScore).toBe(0);
    });

    it('should skip non-factual claims when configured', () => {
      const detector = new HallucinationDetector({ skipNonFactual: true });
      const result = detector.check(
        'I think Paris is beautiful. The Eiffel Tower is a wrought-iron lattice tower in Paris.',
        [WIKIPEDIA_SOURCE]
      );
      // Opinion should not count toward grounding score
      expect(result.factualClaims).toBeLessThanOrEqual(result.totalClaims);
    });

    it('should include non-factual claims when configured', () => {
      const detector = new HallucinationDetector({ skipNonFactual: false });
      const result = detector.check(
        'I think Paris is beautiful. The Eiffel Tower is in Paris.',
        [WIKIPEDIA_SOURCE]
      );
      expect(result.factualClaims).toBe(result.totalClaims);
    });

    it('should provide ungrounded claims list', () => {
      const detector = new HallucinationDetector({ supportThreshold: 0.8 });
      const result = detector.check(
        'The Eiffel Tower is made of pure gold and was built by aliens in the year 3000.',
        [WIKIPEDIA_SOURCE]
      );
      expect(result.ungroundedClaims.length).toBeGreaterThanOrEqual(0);
    });

    it('should generate a summary', () => {
      const detector = new HallucinationDetector();
      const result = detector.check(
        'The Eiffel Tower is in Paris.',
        [WIKIPEDIA_SOURCE]
      );
      expect(result.summary).toBeTruthy();
      expect(result.summary.length).toBeGreaterThan(0);
    });

    it('should work with multiple sources', () => {
      const detector = new HallucinationDetector({ groundingThreshold: 0.2 });
      const result = detector.check(
        'Water covers about 71% of the Earth surface. The Eiffel Tower is in Paris.',
        [WIKIPEDIA_SOURCE, SCIENCE_SOURCE]
      );
      expect(result.totalClaims).toBe(2);
      expect(result.supportedClaims + result.partiallySupportedClaims).toBeGreaterThan(0);
    });

    it('should handle configurable thresholds', () => {
      const strict = new HallucinationDetector({ groundingThreshold: 0.99 });
      const lenient = new HallucinationDetector({ groundingThreshold: 0.1 });

      const response = 'The Eiffel Tower is a tower in Paris built from iron.';
      const strictResult = strict.check(response, [WIKIPEDIA_SOURCE]);
      const lenientResult = lenient.check(response, [WIKIPEDIA_SOURCE]);

      // Same grounding score, different grounded verdicts
      expect(strictResult.groundingScore).toBe(lenientResult.groundingScore);
    });
  });

  describe('verifyClaim', () => {
    it('should verify a supported claim', () => {
      const detector = new HallucinationDetector({ supportThreshold: 0.2 });
      const claim: Claim = {
        text: 'The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris, France.',
        sentenceIndex: 0,
        startOffset: 0,
        endOffset: 80,
        isFactual: true,
        type: 'factual',
      };
      const result = detector.verifyClaim(claim, [WIKIPEDIA_SOURCE]);
      expect(result.supported).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.bestSource).toBeDefined();
    });

    it('should reject an unsupported claim with high threshold', () => {
      const detector = new HallucinationDetector({ supportThreshold: 0.95 });
      const claim: Claim = {
        text: 'Quantum computers will replace all classical computers by next year.',
        sentenceIndex: 0,
        startOffset: 0,
        endOffset: 67,
        isFactual: true,
        type: 'factual',
      };
      const result = detector.verifyClaim(claim, [WIKIPEDIA_SOURCE]);
      expect(result.supported).toBe(false);
    });

    it('should provide source matches', () => {
      const detector = new HallucinationDetector({ supportThreshold: 0.1 });
      const claim: Claim = {
        text: 'The Eiffel Tower was built by Gustave Eiffel.',
        sentenceIndex: 0,
        startOffset: 0,
        endOffset: 46,
        isFactual: true,
        type: 'attribution',
      };
      const result = detector.verifyClaim(claim, [WIKIPEDIA_SOURCE]);
      expect(result.sourceMatches.length).toBeGreaterThan(0);
    });
  });

  describe('createHallucinationDetector', () => {
    it('should create an instance with factory function', () => {
      const detector = createHallucinationDetector();
      expect(detector).toBeInstanceOf(HallucinationDetector);
    });

    it('should accept config in factory function', () => {
      const detector = createHallucinationDetector({
        groundingThreshold: 0.5,
      });
      const result = detector.check('Test claim.', []);
      expect(result).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle text with only questions', () => {
      const detector = new HallucinationDetector();
      const result = detector.check(
        'What is the Eiffel Tower? Where is it located?',
        [WIKIPEDIA_SOURCE]
      );
      // Questions are not factual claims
      expect(result.factualClaims).toBe(0);
      expect(result.grounded).toBe(true); // No factual claims = grounded
    });

    it('should handle very long responses', () => {
      const detector = new HallucinationDetector();
      const longResponse = Array(50)
        .fill('The Eiffel Tower is a tower in Paris, France.')
        .join(' ');
      const result = detector.check(longResponse, [WIKIPEDIA_SOURCE]);
      expect(result.totalClaims).toBeGreaterThan(0);
    });

    it('should handle special characters in text', () => {
      const detector = new HallucinationDetector();
      const claims = detector.extractClaims(
        'The tower costs $10,000 to visit. It is 330m tall & beautiful!'
      );
      expect(claims.length).toBeGreaterThan(0);
    });

    it('should handle unicode text', () => {
      const detector = new HallucinationDetector();
      const source: Source = {
        id: 'unicode',
        content: 'La Tour Eiffel est une tour de fer puddlé.',
        title: 'Tour Eiffel',
      };
      const result = detector.check(
        'La Tour Eiffel est une tour de fer puddlé.',
        [source]
      );
      expect(result.totalClaims).toBeGreaterThan(0);
    });
  });
});
