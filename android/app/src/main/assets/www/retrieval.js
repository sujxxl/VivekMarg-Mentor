/**
 * VivekMarg Mentor - Module 2: Grounded Corpus & Retrieval Engine (retrieval.js)
 * Hybrid TF-IDF + Concept Expansion + Length Normalized Scoring
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    const corpus = require('./corpus_data.js');
    module.exports = factory(corpus);
  } else {
    root.VivekRetrieval = factory(root.VivekCorpus);
  }
}(typeof self !== 'undefined' ? self : this, function(corpusData) {
  'use strict';

  // Standard English Stop-Words
  const STOP_WORDS = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
    'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
    'can', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t',
    'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t',
    'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers',
    'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if',
    'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most',
    'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
    'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d',
    'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s',
    'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they',
    'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under',
    'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were',
    'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who',
    'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d',
    'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves'
  ]);

  // Concept Dictionary: Maps colloquial modern youth dilemmas to 19th-century philosophical terminology
  const CONCEPT_DICTIONARY = {
    // Failure & Exams
    failure: ['means', 'cause', 'effect', 'attention', 'end', 'purpose', 'mistake', 'struggle', 'lesson', 'fall', 'rise', 'responsible'],
    exam: ['means', 'attention', 'concentration', 'end', 'work', 'result', 'anxiety', 'calm', 'focus'],
    fail: ['means', 'mistake', 'fall', 'arise', 'awake', 'strength', 'responsible', 'struggle'],
    backlog: ['mistake', 'past', 'future', 'present', 'means', 'work', 'action', 'duty'],
    
    // Self-worth & Imposter Syndrome
    worthless: ['infinite', 'divinity', 'weakness', 'strength', 'courage', 'power', 'atman', 'soul', 'lion', 'delusion'],
    stupid: ['divinity', 'knowledge', 'infinite', 'unveil', 'discover', 'perfection', 'soul'],
    inferior: ['unique', 'ideal', 'standard', 'nature', 'compare', 'strength', 'faith'],
    insecure: ['fear', 'fearlessness', 'abhih', 'strength', 'atman', 'faith', 'divinity'],
    
    // Heartbreak & Loneliness
    heartbreak: ['attachment', 'love', 'non-attachment', 'freedom', 'witness', 'clinging', 'letting go', 'soul'],
    lonely: ['alone', 'solitude', 'atman', 'one', 'universal', 'unity', 'companion', 'divine'],
    breakup: ['attachment', 'bondage', 'freedom', 'witness', 'lake', 'ripples', 'love', 'non-attachment'],
    rejection: ['stand', 'rock', 'unattached', 'flaws', 'mirror', 'self-reliance', 'independent'],
    
    // Focus, Distraction & Social Media
    focus: ['ekagrata', 'concentration', 'unbroken', 'single-minded', 'scatter', 'monkey', 'pratyahara', 'lake'],
    distracted: ['monkey', 'restraint', 'pratyahara', 'scattered', 'laser', 'one idea', 'dharana'],
    phone: ['senses', 'restraint', 'pratyahara', 'scattered', 'control', 'external'],
    addiction: ['slave', 'master', 'senses', 'desire', 'pratyahara', 'restraint', 'will'],

    // Procrastination & Laziness
    procrastination: ['action', 'work', 'duty', 'karma', 'unselfish', 'lethargy', 'awake', 'arise', 'present'],
    lazy: ['arise', 'awake', 'action', 'prana', 'vital', 'struggle', 'power', 'bold'],
    unmotivated: ['arise', 'awake', 'ideal', 'faith', 'strength', 'fire', 'purpose', 'work'],
    
    // Comparison & Jealousy
    comparison: ['unique', 'nature', 'svadharma', 'jealousy', 'competition', 'own path', 'purity', 'ideal'],
    jealous: ['poison', 'purity', 'heart', 'unique', 'diversity', 'unity', 'praise', 'blame'],
    envy: ['poison', 'unique', 'standard', 'purity', 'ideal', 'svadharma'],

    // Anger & Frustration
    anger: ['restraint', 'self-control', 'wave', 'lake', 'patience', 'forgiveness', 'calm', 'master'],
    frustrated: ['lake', 'ripples', 'patience', 'perseverance', 'unattached', 'desert', 'calm'],
    stress: ['calm', 'unattached', 'witness', 'mind', 'control', 'stillness', 'rest', 'peace'],
    anxiety: ['results', 'future', 'present', 'means', 'unattached', 'fear', 'fearlessness', 'abhih'],

    // Fear & Mortality
    death: ['immortal', 'fearlessness', 'abhih', 'deathless', 'body', 'change', 'indestructible', 'soul'],
    fear: ['abhih', 'fearlessness', 'strength', 'sin', 'weakness', 'lion', 'divinity', 'courage'],

    // Duty & Purpose
    duty: ['karma', 'obligation', 'detached', 'ideal', 'right', 'standard', 'worship', 'ennobles'],
    purpose: ['ideal', 'one idea', 'manifest', 'divinity', 'growth', 'unveil', 'arise']
  };

  // Helper: Tokenize text
  function tokenize(text) {
    if (!text || typeof text !== 'string') return [];
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/[\s-]+/)
      .filter(t => t.length > 1 && !STOP_WORDS.has(t));
  }

  // Precompute Inverted Index and Document Lengths
  class RetrievalEngine {
    constructor(corpus) {
      this.corpus = corpus || [];
      this.docIndex = [];
      this.df = {}; // Document frequencies for terms
      this.numDocs = this.corpus.length;
      this.buildIndex();
    }

    buildIndex() {
      this.docIndex = this.corpus.map((doc, idx) => {
        const paragraphText = typeof doc.paragraph === 'string' ? doc.paragraph : (doc.text || '');
        const sectionText = doc.section || doc.title || '';
        const fullText = `${doc.title || ''} ${sectionText} ${paragraphText}`;
        const tokens = tokenize(fullText);
        const termCounts = {};
        for (const token of tokens) {
          termCounts[token] = (termCounts[token] || 0) + 1;
        }

        const uniqueTokens = Object.keys(termCounts);
        for (const token of uniqueTokens) {
          this.df[token] = (this.df[token] || 0) + 1;
        }

        const normalizedDoc = Object.assign({}, doc, {
          paragraph: paragraphText,
          section: sectionText
        });

        return {
          id: doc.id,
          doc: normalizedDoc,
          tokens: tokens,
          termCounts: termCounts,
          docLength: tokens.length || 1
        };
      });
    }

    // Expand query with concept dictionary
    expandQuery(queryTokens) {
      const expandedTerms = new Set(queryTokens);
      const matchedThemes = new Set();

      for (const token of queryTokens) {
        if (CONCEPT_DICTIONARY[token]) {
          matchedThemes.add(token);
          for (const synonym of CONCEPT_DICTIONARY[token]) {
            expandedTerms.add(synonym);
          }
        }
      }

      return {
        expandedTokens: Array.from(expandedTerms),
        matchedThemes: Array.from(matchedThemes)
      };
    }

    // Hybrid TF-IDF Retrieval
    search(query, options = {}) {
      const topK = options.topK || 3;
      const confidenceThreshold = options.threshold !== undefined ? options.threshold : 0.10;

      const rawTokens = tokenize(query);
      if (rawTokens.length === 0) {
        return {
          isClarifyingPath: true,
          reason: 'NO_QUERY_TOKENS',
          message: 'Please articulate the specific situation or inner feeling you wish to examine.',
          results: []
        };
      }

      const { expandedTokens, matchedThemes } = this.expandQuery(rawTokens);

      const queryTermWeights = {};
      for (const token of rawTokens) {
        queryTermWeights[token] = (queryTermWeights[token] || 0) + 2.0; // Higher weight for direct terms
      }
      for (const token of expandedTokens) {
        if (!queryTermWeights[token]) {
          queryTermWeights[token] = 1.0; // Concept expansion weight
        }
      }

      const scoredDocs = [];

      for (const item of this.docIndex) {
        let tfidfScore = 0;
        let matchedDirectTokens = 0;
        let matchedConceptTokens = 0;

        for (const [term, qWeight] of Object.entries(queryTermWeights)) {
          const count = item.termCounts[term] || 0;
          if (count > 0) {
            // BM25 / TF-IDF style term frequency
            const tf = count / (count + 1.2 * (0.25 + 0.75 * (item.docLength / 45.0)));
            const idf = Math.log(1 + (this.numDocs - (this.df[term] || 0) + 0.5) / ((this.df[term] || 0) + 0.5));
            tfidfScore += tf * idf * qWeight;

            if (rawTokens.includes(term)) {
              matchedDirectTokens++;
            } else {
              matchedConceptTokens++;
            }
          }
        }

        // Bounded concept boost (0.15 - 0.30)
        let themeBonus = 0;
        if (matchedThemes.length > 0) {
          const themeBonusStep = 0.08;
          themeBonus = Math.min(0.30, matchedThemes.length * themeBonusStep);
        }

        // Title match bonus
        const titleTokens = tokenize(item.doc.title);
        let titleMatches = 0;
        for (const t of rawTokens) {
          if (titleTokens.includes(t)) titleMatches++;
        }
        const titleBonus = titleMatches * 0.05;

        // Normalization by sqrt(docLength) to prevent sprawling passages from dominating
        const lengthNorm = Math.sqrt(item.docLength);
        const finalScore = ((tfidfScore / lengthNorm) + themeBonus + titleBonus);

        if (finalScore > 0) {
          scoredDocs.push({
            score: finalScore,
            doc: item.doc,
            matchedThemes: matchedThemes,
            directMatches: matchedDirectTokens,
            conceptMatches: matchedConceptTokens
          });
        }
      }

      scoredDocs.sort((a, b) => b.score - a.score);

      const topResult = scoredDocs[0];
      if (!topResult || topResult.score < confidenceThreshold) {
        return {
          isClarifyingPath: true,
          score: topResult ? topResult.score : 0,
          confidenceThreshold: confidenceThreshold,
          message: 'The inquiry does not yet have enough philosophical clarity. Let us isolate the root question.',
          clarifyingPrompts: [
            'Is this primarily about an action you must undertake (Karma Yoga)?',
            'Is this about mastering scattered attention or intrusive thoughts (Raja Yoga)?',
            'Is this about feelings of weakness, self-doubt, or grief (Practical Vedanta)?',
            'Is this about attachment, comparison, or relationship conflict (Bhakti / Non-Attachment)?'
          ],
          results: scoredDocs.slice(0, topK)
        };
      }

      return {
        isClarifyingPath: false,
        topScore: topResult.score,
        matchedThemes: topResult.matchedThemes,
        results: scoredDocs.slice(0, topK)
      };
    }

    // Get specific chunk by ID
    getChunkById(chunkId) {
      const match = this.corpus.find(c => c.id === chunkId);
      return match || null;
    }
  }

  return {
    RetrievalEngine,
    CONCEPT_DICTIONARY,
    STOP_WORDS,
    tokenize
  };
}));
