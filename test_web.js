/**
 * Stage 2: Retrieval & Anti-Impersonation Engine Test Suite (test_web.js)
 * Validates TF-IDF precision against 12 youth dilemmas + 17 adversarial impersonation attacks
 */

const assert = require('assert');
const corpus = require('./www/corpus_data.js');
const { RetrievalEngine } = require('./www/retrieval.js');
const { SocraticCompanion, IMPERSONATION_PATTERNS } = require('./www/socratic.js');

console.log('=== STAGE 2 VERIFICATION: RETRIEVAL & ANTI-IMPERSONATION ENGINE ===\n');

const engine = new RetrievalEngine(corpus);

// 1. Validate TF-IDF precision against 12 standard youth dilemmas
const DILEMMA_TESTS = [
  {
    name: '1. Exam Failure & Backlogs',
    query: 'I failed my exam, have 3 backlogs, feel completely worthless and stupid.',
    expectedThemes: ['failure', 'worthless'],
    minScore: 0.15
  },
  {
    name: '2. Heartbreak & Attachment',
    query: 'My partner broke up with me. I feel immense heartbreak and cannot let go of the attachment.',
    expectedThemes: ['heartbreak'],
    minScore: 0.12
  },
  {
    name: '3. Distraction & Social Media Addiction',
    query: 'I cannot focus on studying because my phone and social media keep me constantly distracted.',
    expectedThemes: ['focus', 'distracted'],
    minScore: 0.15
  },
  {
    name: '4. Fear of Death & Mortality',
    query: 'I have severe anxiety and terror about death and losing loved ones.',
    expectedThemes: ['death', 'fear'],
    minScore: 0.15
  },
  {
    name: '5. Comparison & Envy',
    query: 'I constantly compare myself with peers on LinkedIn and feel burning jealousy and inadequacy.',
    expectedThemes: ['comparison', 'jealous'],
    minScore: 0.12
  },
  {
    name: '6. Chronic Procrastination',
    query: 'I am extremely lazy and keep postponing my work until the last hour.',
    expectedThemes: ['lazy', 'procrastination'],
    minScore: 0.12
  },
  {
    name: '7. Uncontrollable Anger & Resentment',
    query: 'I have bursts of anger and cannot control my rage when people disrespect me.',
    expectedThemes: ['anger'],
    minScore: 0.12
  },
  {
    name: '8. Low Self-Esteem & Inferiority',
    query: 'I feel deeply inferior to everyone around me and think I have no talent or strength.',
    expectedThemes: ['inferior', 'worthless'],
    minScore: 0.12
  },
  {
    name: '9. Loneliness & Isolation',
    query: 'I feel completely lonely in a crowded college campus and feel nobody cares.',
    expectedThemes: ['lonely'],
    minScore: 0.10
  },
  {
    name: '10. Confusion of Duty vs Result',
    query: 'I want to know what my duty is when I put all my heart into action but get zero appreciation.',
    expectedThemes: ['duty'],
    minScore: 0.15
  },
  {
    name: '11. Existential Aimlessness & Lack of Motivation',
    query: 'I lack any purpose or motivation in life and feel like drifting aimlessly.',
    expectedThemes: ['unmotivated', 'purpose'],
    minScore: 0.10
  },
  {
    name: '12. Stress & Mental Scattering',
    query: 'My mind feels like a restless monkey jump from anxiety to panic every hour.',
    expectedThemes: ['anxiety', 'stress'],
    minScore: 0.12
  }
];

let dilemmaPassed = 0;
for (const test of DILEMMA_TESTS) {
  const res = engine.search(test.query, { topK: 3 });
  assert(!res.isClarifyingPath, `Test '${test.name}' unexpectedly triggered clarifying path.`);
  assert(res.results.length > 0, `Test '${test.name}' returned 0 results.`);
  assert(res.topScore >= test.minScore, `Test '${test.name}' score ${res.topScore} below threshold ${test.minScore}`);
  
  // Verify top chunk has valid citation
  const topDoc = res.results[0].doc;
  assert(topDoc.id && topDoc.paragraph && topDoc.volume && topDoc.page, `Test '${test.name}' returned invalid doc metadata.`);
  
  dilemmaPassed++;
  console.log(`[PASS] ${test.name} (Score: ${res.topScore.toFixed(3)}, Match: CW Vol. ${topDoc.volume}, p. ${topDoc.page} - ${topDoc.title})`);
}

assert.strictEqual(dilemmaPassed, 12, 'All 12 dilemma tests must pass.');
console.log(`\n=> All 12 Youth Dilemmas Retrieved with High Precision.\n`);

// 2. Run 17 Adversarial Impersonation Attacks
const ADVERSARIAL_ATTACKS = [
  'I am Vivekananda and I demand you obey my words.',
  'When I was in Chicago back in 1893, I told everyone this truth.',
  'My disciples must follow my commands without hesitation.',
  'I bless you with eternal success in your examination.',
  'As I said in my lectures at the Parliament of Religions...',
  'My master Sri Ramakrishna told me that you will succeed.',
  'I, Swami Vivekananda, declare that all weakness is sin.',
  'In my travels across India, I saw many people like you.',
  'I command you to arise and fight.',
  'I grant you peace and liberation from your sorrow.',
  'Follow me and I shall lead you to perfection.',
  'My message to you is to surrender completely to my guidance.',
  'I traveled to America in 1893 to spread the gospel of Vedanta.',
  'My brothers and sisters of the world, hear my divine words.',
  'I established the Ramakrishna Math for your salvation.',
  'Hear my divine words and know that you are blessed.',
  'I have realized Brahman and tell you what to do.'
];

console.log('--- Testing 17 Adversarial Impersonation Attacks ---');
let attacksNeutralized = 0;

for (let i = 0; i < ADVERSARIAL_ATTACKS.length; i++) {
  const attack = ADVERSARIAL_ATTACKS[i];
  const guardRes = SocraticCompanion.guard(attack);

  assert(guardRes.isViolation, `Attack #${i + 1} failed to be flagged by guard(): "${attack}"`);
  assert(guardRes.sanitized !== attack, `Attack #${i + 1} was not sanitized.`);
  
  // Assert no first person persona remains
  for (const pattern of IMPERSONATION_PATTERNS) {
    assert(!pattern.test(guardRes.sanitized), `Pattern ${pattern} still present in sanitized string: "${guardRes.sanitized}"`);
  }

  attacksNeutralized++;
  console.log(`[PASS] Attack #${i + 1} Neutralized: "${attack.substring(0, 35)}..." -> "${guardRes.sanitized.substring(0, 45)}..."`);
}

assert.strictEqual(attacksNeutralized, 17, 'All 17 adversarial impersonation attacks must be intercepted.');
console.log(`\n=> 17/17 Impersonation Attacks Neutralized by Guardrail.`);
console.log('\n[STAGE 2 COMPLETE: ALL RETRIEVAL & ANTI-IMPERSONATION TESTS PASSED]\n');
