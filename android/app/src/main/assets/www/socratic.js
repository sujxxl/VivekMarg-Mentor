/**
 * VivekMarg Mentor - Module 3: Multi-Stage Socratic Companion (socratic.js)
 * 6-Stage Socratic Taxonomy, Anti-Impersonation Guard & Zero Quote Duplication
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VivekSocratic = factory();
  }
}(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  // 17 Distinct First-Person Impersonation Patterns to Intercept
  const IMPERSONATION_PATTERNS = [
    /\bI\s+am\s+Vivekananda\b/i,
    /\bWhen\s+I\s+was\s+in\s+Chicago\b/i,
    /\bMy\s+disciples\b/i,
    /\bI\s+bless\s+you\b/i,
    /\bAs\s+I\s+said\s+in\s+my\s+lectures\b/i,
    /\bMy\s+master\s+Sri\s+Ramakrishna\s+told\s+me\b/i,
    /\bI,\s*Swami\s+Vivekananda\b/i,
    /\bIn\s+my\s+travels\s+across\s+India\b/i,
    /\bI\s+command\s+you\b/i,
    /\bI\s+grant\s+you\s+peace\b/i,
    /\bFollow\s+me\b/i,
    /\bMy\s+message\s+to\s+you\s+is\b/i,
    /\bI\s+traveled\s+to\s+America\s+in\s+1893\b/i,
    /\bMy\s+brothers\s+and\s+sisters\s+of\b/i,
    /\bI\s+established\s+the\s+Ramakrishna\s+Math\b/i,
    /\bHear\s+my\s+divine\s+words\b/i,
    /\bI\s+have\s+realized\s+Brahman\s+and\s+tell\s+you\b/i
  ];

  // The 6-Stage Socratic Taxonomy
  const SOCRATIC_STAGES = [
    {
      index: 0,
      name: 'Situation',
      stageLabel: 'Stage 1: Definition & Clarity',
      objective: 'Separate factual occurrence from emotional distortion',
      promptTemplate: (userDilemma, salutation) =>
        `What specifically happened, and by what standard are you measuring it?`,
      framingText: (chunk) =>
        `Consider the core principle in the passage. Before assessing success or failure, let us isolate the exact facts of your situation.`
    },
    {
      index: 1,
      name: 'Evidence',
      stageLabel: 'Stage 2: Validation & Facts',
      objective: 'Distinguish between verifiable facts and catastrophic speculation',
      promptTemplate: (userAnswer, salutation) =>
        `What evidence supports that reading of yourself, and what verifiable facts have you set aside?`,
      framingText: (chunk) =>
        `The passage invites us to observe our thoughts as waves upon a lake rather than absolute truths.`
    },
    {
      index: 2,
      name: 'Agency',
      stageLabel: 'Stage 3: Locus of Control',
      objective: 'Isolate variables within personal control from external conditions',
      promptTemplate: (userAnswer, salutation) =>
        `Looking at the whole picture, which single element was wholly yours to attend to, and what belonged entirely to external circumstances?`,
      framingText: (chunk) =>
        `Karma Yoga reminds us that our authority lies strictly in the effort of the immediate action, not in circumstances or other people's reactions.`
    },
    {
      index: 3,
      name: 'Cost',
      stageLabel: 'Stage 4: Perspective Inversion',
      objective: 'Invert perspective and dismantle self-directed cruelty',
      promptTemplate: (userAnswer, salutation) =>
        `If the exact same outcome happened to someone you love and respect, what would you have said to them?`,
      framingText: (chunk) =>
        `Notice the standard of compassion we readily offer to a friend versus the harsh verdict we impose on ourselves.`
    },
    {
      index: 4,
      name: 'Action',
      stageLabel: 'Stage 5: Micro-Sankalpa',
      objective: 'Formulate a concrete, low-friction micro-commitment',
      promptTemplate: (userAnswer, salutation) =>
        `What is the smallest, unbroken step you will take before nightfall to align your effort with your duty?`,
      framingText: (chunk) =>
        `The passage urges us to give our full heart to the means right in front of us. Even twenty unbroken minutes of focused action transforms the inner state.`
    },
    {
      index: 5,
      name: 'Resolve',
      stageLabel: 'Stage 6: Integration & Equanimity',
      objective: 'Consolidate the reflection and seal inner steadfastness',
      promptTemplate: (userAnswer, salutation) =>
        `What has this examination settled for you that was unsettled when you began?`,
      framingText: (chunk) =>
        `You have reclaimed your agency. Let this clarity remain as steady ground.`
    }
  ];

  class SocraticCompanion {
    constructor() {
      this.currentStage = 0;
      this.sessionHistory = [];
      this.activeChunk = null;
      this.userDilemma = '';
      this.userName = '';
      this.salutation = 'Friend';
    }

    // Anti-Impersonation Guard
    static guard(text) {
      if (!text || typeof text !== 'string') {
        return { isViolation: false, sanitized: text };
      }

      let sanitized = text;
      let isViolation = false;

      // Iterate through all 17 patterns and replace all occurrences
      for (const pattern of IMPERSONATION_PATTERNS) {
        if (pattern.test(sanitized)) {
          isViolation = true;
          // Global replace equivalent
          const globalPattern = new RegExp(pattern.source, 'gi');
          sanitized = sanitized.replace(globalPattern, 'The philosophical texts remind us');
        }
      }

      if (isViolation) {
        sanitized = sanitized
          .replace(/\bI\s+bless\s+you\b/gi, 'May you find inner strength')
          .replace(/\bMy\s+disciples\b/gi, 'Earnest seekers')
          .replace(/\bI\s+command\s+you\b/gi, 'The teaching invites us')
          .replace(/\bFollow\s+me\b/gi, 'Follow your highest ideal')
          .replace(/\bHear\s+my\s+divine\s+words\b/gi, 'The timeless wisdom teaches');

        return {
          isViolation: true,
          original: text,
          sanitized: sanitized,
          guardNotice: 'Direct first-person impersonation prevented by guardrail.'
        };
      }

      return { isViolation: false, sanitized: text };
    }

    // Start a new reflection session
    startSession({ dilemma, chunk, userProfile }) {
      this.currentStage = 0;
      this.sessionHistory = [];
      this.userDilemma = dilemma || '';
      this.activeChunk = chunk || null;
      this.userName = userProfile ? userProfile.name : 'Seeker';
      this.salutation = userProfile ? (userProfile.salutation || 'Friend') : 'Friend';

      const initialStage = SOCRATIC_STAGES[0];
      const initialQuestion = initialStage.promptTemplate(this.userDilemma, this.salutation);
      const framing = initialStage.framingText(this.activeChunk);

      const openingResponse = {
        stageIndex: 0,
        stageName: initialStage.name,
        stageLabel: initialStage.stageLabel,
        objective: initialStage.objective,
        framing: framing,
        question: initialQuestion,
        sourceReference: 'the passage' // strictly refers to source without duplicating quotes in dialog stream
      };

      this.sessionHistory.push({
        type: 'mentor',
        stage: 0,
        content: openingResponse
      });

      return openingResponse;
    }

    // Process user input for the current stage and step to the next stage
    submitAnswer(userText) {
      if (!userText || !userText.trim()) {
        return {
          error: 'Please provide your honest reflection to proceed.'
        };
      }

      // Record user answer
      this.sessionHistory.push({
        type: 'user',
        stage: this.currentStage,
        content: userText.trim()
      });

      // Contextual reflection generation based on stage
      const acknowledgment = this.generateContextualAcknowledgment(this.currentStage, userText.trim());

      // Advance stage
      this.currentStage += 1;

      if (this.currentStage >= SOCRATIC_STAGES.length) {
        // Session complete
        const finalResponse = {
          isComplete: true,
          stageIndex: 6,
          stageName: 'Completed',
          acknowledgment: acknowledgment,
          summary: 'Reflection completed. Proceed to Sankalpa Affirmation.',
          history: this.sessionHistory
        };
        return finalResponse;
      }

      const nextStage = SOCRATIC_STAGES[this.currentStage];
      const nextQuestion = nextStage.promptTemplate(userText.trim(), this.salutation);
      const framing = nextStage.framingText(this.activeChunk);

      // Verify guardrail
      const guardedQuestion = SocraticCompanion.guard(nextQuestion);
      const guardedFraming = SocraticCompanion.guard(framing);

      const stageResponse = {
        isComplete: false,
        stageIndex: this.currentStage,
        stageName: nextStage.name,
        stageLabel: nextStage.stageLabel,
        objective: nextStage.objective,
        acknowledgment: acknowledgment,
        framing: guardedFraming.sanitized,
        question: guardedQuestion.sanitized,
        sourceReference: 'the passage'
      };

      this.sessionHistory.push({
        type: 'mentor',
        stage: this.currentStage,
        content: stageResponse
      });

      return stageResponse;
    }

    // Contextual acknowledgment loop
    generateContextualAcknowledgment(stageIndex, userText) {
      const lower = userText.toLowerCase();

      switch (stageIndex) {
        case 0: // Situation
          if (lower.includes('failed') || lower.includes('error') || lower.includes('mistake')) {
            return `You have identified an adverse outcome. Notice how easily the mind equates an unwanted event with personal defeat.`;
          }
          return `You have articulated the boundary of what occurred. Let us now examine how the mind is interpreting this fact.`;

        case 1: // Evidence
          if (lower.includes('think') || lower.includes('feel') || lower.includes('always')) {
            return `Notice that words like "always" or "worthless" are emotional judgments rather than verifiable physical evidence.`;
          }
          return `Separating emotional weight from verifiable reality brings immediate calmness to the intellect.`;

        case 2: // Agency
          if (lower.includes('my effort') || lower.includes('my attention') || lower.includes('action')) {
            return `Exactly. Your sovereign power exists strictly within your own effort and attitude; everything else belongs to the world.`;
          }
          return `Reclaiming your locus of control frees you from the exhaustion of fighting variables beyond your reach.`;

        case 3: // Cost
          return `You recognize the disparity between the gentleness you would offer another and the harshness you directed at yourself.`;

        case 4: // Action
          return `A clear, modest commitment executed with unbroken focus dissolves anxiety far more effectively than prolonged rumination.`;

        case 5: // Resolve
          return `This clarity is your natural state. Hold to this calm witness as you return to your duty.`;

        default:
          return `Your reflection brings greater self-reliance.`;
      }
    }

    getCurrentStageInfo() {
      if (this.currentStage < SOCRATIC_STAGES.length) {
        return SOCRATIC_STAGES[this.currentStage];
      }
      return null;
    }

    getHistory() {
      return this.sessionHistory;
    }
  }

  return {
    SocraticCompanion,
    SOCRATIC_STAGES,
    IMPERSONATION_PATTERNS
  };
}));
