  // Resolve Active Corpus Source
  const activeCorpusSource = (typeof VM_CORPUS !== 'undefined' && VM_CORPUS.chunks && VM_CORPUS.chunks.length > 0)
    ? VM_CORPUS.chunks.map(c => ({
        id: c.id,
        volume: c.volume,
        page: c.page,
        chapterRoman: c.chapterRoman,
        section: c.title,
        title: c.title,
        paragraph: c.text || c.paragraph
      }))
    : (typeof VivekCorpus !== 'undefined' ? VivekCorpus : []);

  // Instantiate Core Modules
  const accountManager = new VivekAccount.AccountManager();
  const retrievalEngine = new VivekRetrieval.RetrievalEngine(activeCorpusSource);
  const socraticCompanion = new VivekSocratic.SocraticCompanion();
  const speechEngine = new VivekSpeech.SpeechEngine();
  const affirmationPlayer = new VivekManifest.AffirmationPlayer(speechEngine);

  // Application State
  let currentDilemma = '';
  let activeChunk = null;
  let isWatermarkActive = false;
  let userSankalpa = '';

  // DOM Elements
  const shieldBtn = document.getElementById('shield-toggle-btn');
  const langSelect = document.getElementById('lang-select');
  const dialectBanner = document.getElementById('dialect-banner');
  const dialectBannerText = document.getElementById('dialect-banner-text');
  
  const sourceQuoteText = document.getElementById('source-quote-text');
  const metaSection = document.getElementById('meta-section');
  const metaChapter = document.getElementById('meta-chapter');
  const metaCitation = document.getElementById('meta-citation');
  const speakQuoteBtn = document.getElementById('speak-quote-btn');

  const currentStageBadge = document.getElementById('current-stage-badge');
  const chatHistory = document.getElementById('socratic-chat-history');
  const socraticForm = document.getElementById('socratic-form');
  const socraticInput = document.getElementById('socratic-input');
  const submitStepBtn = document.getElementById('submit-step-btn');
  const voiceMicBtn = document.getElementById('voice-mic-btn');
  const pressToHearBtn = document.getElementById('press-to-hear-btn');
  const newReflectionBtn = document.getElementById('new-reflection-btn');

  const vaultBtn = document.getElementById('vault-btn');
  const vaultStatusLabel = document.getElementById('vault-status-label');
  const growthBtn = document.getElementById('growth-btn');
  const userGreetingLabel = document.getElementById('user-greeting-label');

  const vaultModal = document.getElementById('vault-modal');
  const closeVaultModal = document.getElementById('close-vault-modal');
  const vaultProfileForm = document.getElementById('vault-profile-form');
  const guestModeBtn = document.getElementById('guest-mode-btn');

  const growthModal = document.getElementById('growth-modal');
  const closeGrowthModal = document.getElementById('close-growth-modal');
  const exportDataBtn = document.getElementById('export-data-btn');
  const lockVaultBtn = document.getElementById('lock-vault-btn');

  // Initialize App
  async function init() {
    setupEventListeners();
    setupSpeechCallbacks();

    // Check account status
    if (accountManager.hasAccount()) {
      vaultStatusLabel.textContent = 'Unlock';
      showVaultModal();
    } else {
      // Auto-enter guest mode or prompt
      accountManager.enterGuestMode();
      updateUserGreeting();
    }

    // Default initial reflection
    startNewReflection("I feel overwhelmed by my duties and fear that I will fail in my expectations.");
  }

  function setupEventListeners() {
    // Watermark Shield Toggle
    shieldBtn?.addEventListener('click', toggleWatermark);

    // Language Selector
    langSelect?.addEventListener('change', (e) => {
      const selectedLang = e.target.value;
      speechEngine.setLanguage(selectedLang);
      updateDialectBanner(selectedLang);
    });

    // Voice Dictation
    voiceMicBtn?.addEventListener('click', toggleVoiceDictation);

    // Press to Hear Guidance
    pressToHearBtn?.addEventListener('click', () => {
      const currentStage = socraticCompanion.getCurrentStageInfo();
      if (currentStage) {
        speechEngine.speak(currentStage.promptTemplate(socraticInput.value, accountManager.getProfile()?.salutation));
      } else {
        speechEngine.speakNavCue('start_reflection');
      }
    });

    // Speak Source Quote
    speakQuoteBtn?.addEventListener('click', () => {
      if (activeChunk) {
        speechEngine.speak(activeChunk.paragraph, { lang: 'en-IN', rate: 0.80 });
      }
    });

    // Socratic Form Submit
    socraticForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      handleUserInput();
    });

    submitStepBtn?.addEventListener('click', handleUserInput);

    // Reset reflection
    newReflectionBtn?.addEventListener('click', () => {
      socraticInput.value = '';
      socraticInput.placeholder = 'State your current situation or struggle...';
      chatHistory.innerHTML = '';
      activeChunk = null;
      renderInitialPrompt();
    });

    // Vault & Growth Modals
    vaultBtn?.addEventListener('click', () => {
      showVaultModal();
    });

    closeVaultModal?.addEventListener('click', () => {
      vaultModal.classList.add('hidden');
    });

    growthBtn?.addEventListener('click', () => {
      renderGrowthCompass();
      growthModal.classList.remove('hidden');
    });

    closeGrowthModal?.addEventListener('click', () => {
      growthModal.classList.add('hidden');
    });

    guestModeBtn?.addEventListener('click', () => {
      accountManager.enterGuestMode();
      updateUserGreeting();
      vaultModal.classList.add('hidden');
    });

    vaultProfileForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('profile-name').value;
      const salutation = document.getElementById('profile-salutation').value;
      const pin = document.getElementById('profile-pin').value;
      const lang = langSelect.value;

      if (accountManager.hasAccount()) {
        const verifyRes = await accountManager.verifyPasscode(pin);
        if (verifyRes.success) {
          vaultModal.classList.add('hidden');
          updateUserGreeting();
        } else {
          alert('Incorrect PIN passcode.');
        }
      } else {
        await accountManager.createProfile({ name, salutation, lang, pin });
        vaultModal.classList.add('hidden');
        updateUserGreeting();
      }
    });

    lockVaultBtn?.addEventListener('click', () => {
      accountManager.lock();
      vaultStatusLabel.textContent = 'Unlock';
      growthModal.classList.add('hidden');
      showVaultModal();
    });

    exportDataBtn?.addEventListener('click', () => {
      const dataStr = accountManager.exportData();
      if (!dataStr) return;
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vivekmarg_vault_${Date.now()}.json`;
      a.click();
    });
  }

  function setupSpeechCallbacks() {
    speechEngine.onListenResult = ({ transcript, isFinal }) => {
      socraticInput.value = transcript;
      if (isFinal) {
        voiceMicBtn.classList.remove('listening');
      }
    };

    speechEngine.onListenError = () => {
      voiceMicBtn.classList.remove('listening');
    };
  }

  function toggleVoiceDictation() {
    if (speechEngine.isListening) {
      speechEngine.stopListening();
      voiceMicBtn.classList.remove('listening');
    } else {
      speechEngine.startListening();
      voiceMicBtn.classList.add('listening');
    }
  }

  function toggleWatermark() {
    isWatermarkActive = !isWatermarkActive;
    document.body.classList.toggle('verify', isWatermarkActive);
    shieldBtn.classList.toggle('active', isWatermarkActive);
  }

  function updateDialectBanner(langCode) {
    const notice = speechEngine.getDialectNotice(langCode);
    if (notice.isFallback) {
      dialectBannerText.textContent = notice.message;
      dialectBanner.classList.remove('hidden');
    } else {
      dialectBanner.classList.add('hidden');
    }
  }

  function updateUserGreeting() {
    const profile = accountManager.getProfile();
    if (profile) {
      userGreetingLabel.textContent = profile.name || 'Compass';
      vaultStatusLabel.textContent = profile.isGuest ? 'Guest' : 'Vault';
    }
  }

  function showVaultModal() {
    vaultModal.classList.remove('hidden');
  }

  // Start a new Socratic reflection session
  function startNewReflection(dilemmaText) {
    currentDilemma = dilemmaText;
    const profile = accountManager.getProfile();

    // 1. Retrieve most relevant verbatim passage via Hybrid RAG
    const searchResult = retrievalEngine.search(dilemmaText, { topK: 1, threshold: 0.10 });
    
    if (searchResult.isClarifyingPath || searchResult.results.length === 0) {
      // Clarifying path fallback
      activeChunk = VivekCorpus[0];
    } else {
      activeChunk = searchResult.results[0].doc;
    }

    // 2. Render Left Source Anchor Panel
    renderSourceAnchor(activeChunk);

    // 3. Initialize Socratic companion
    chatHistory.innerHTML = '';
    const initialPrompt = socraticCompanion.startSession({
      dilemma: dilemmaText,
      chunk: activeChunk,
      userProfile: profile
    });

    renderMentorMessage(initialPrompt);
    updateStageBadge(initialPrompt.stageLabel);

    // Audio Dual-Pacing: speak source then question
    speechEngine.speakThen({
      quoteText: activeChunk.paragraph,
      dialogueText: initialPrompt.question,
      regionalLang: langSelect.value
    });
  }

  function renderInitialPrompt() {
    const introCard = document.createElement('div');
    introCard.className = 'message-card mentor';
    introCard.innerHTML = `
      <div class="framing">Welcome to VivekMarg Mentor. Speak or type the dilemma, doubt, or inner conflict you are facing right now.</div>
      <div class="question">What challenge or internal struggle is presently scattering your mind?</div>
    `;
    chatHistory.appendChild(introCard);
    currentStageBadge.textContent = 'Inquiry Initialization';
  }

  function renderSourceAnchor(chunk) {
    if (!chunk) return;
    sourceQuoteText.textContent = chunk.paragraph;
    metaSection.textContent = chunk.section || 'Complete Works';
    metaChapter.textContent = chunk.chapterRoman || 'I';
    metaCitation.textContent = `CW Vol. ${chunk.volume}, p. ${chunk.page}`;
  }

  function renderMentorMessage(stageData) {
    const card = document.createElement('div');
    card.className = 'message-card mentor';

    let ackHtml = '';
    if (stageData.acknowledgment) {
      ackHtml = `<div class="acknowledgment">${stageData.acknowledgment}</div>`;
    }

    card.innerHTML = `
      ${ackHtml}
      <div class="framing">${stageData.framing}</div>
      <div class="question">${stageData.question}</div>
    `;

    chatHistory.appendChild(card);
    card.scrollIntoView({ behavior: 'smooth' });
  }

  function renderUserMessage(text) {
    const card = document.createElement('div');
    card.className = 'message-card user';
    card.innerHTML = `
      <div class="user-label">Your Reflection</div>
      <div class="user-text">${text}</div>
    `;
    chatHistory.appendChild(card);
    card.scrollIntoView({ behavior: 'smooth' });
  }

  function updateStageBadge(label) {
    if (currentStageBadge) {
      currentStageBadge.textContent = label;
    }
  }

  // Process User Step Answer
  function handleUserInput() {
    const text = socraticInput.value.trim();
    if (!text) return;

    socraticInput.value = '';

    // If starting from fresh state
    if (socraticCompanion.sessionHistory.length === 0) {
      startNewReflection(text);
      return;
    }

    // Render user response
    renderUserMessage(text);

    // If at Action Stage (Stage 4 -> index 4), capture Sankalpa
    if (socraticCompanion.currentStage === 4) {
      userSankalpa = text;
      accountManager.addSankalpa(text, activeChunk?.section || 'duty');
    }

    // Process Socratic Stage Transition
    const nextStep = socraticCompanion.submitAnswer(text);

    if (nextStep.isComplete) {
      // Record completed session in identity vault
      accountManager.recordSession({
        dilemma: currentDilemma,
        matchedChunkId: activeChunk ? activeChunk.id : null,
        theme: activeChunk ? activeChunk.section : 'general',
        sankalpaId: userSankalpa,
        stagesCompleted: 6
      });

      // Launch full-screen closing affirmation reel
      affirmationPlayer.start({
        dilemma: currentDilemma,
        chunk: activeChunk,
        sankalpa: userSankalpa,
        userProfile: accountManager.getProfile()
      });

      updateStageBadge('Session Completed • Sankalpa Active');
    } else {
      renderMentorMessage(nextStep);
      updateStageBadge(nextStep.stageLabel);

      // Speak next prompt in chosen language
      speechEngine.speak(nextStep.question, { lang: langSelect.value });
    }
  }

  function renderGrowthCompass() {
    const profile = accountManager.getProfile();
    if (!profile) return;

    document.getElementById('vector-steadiness').textContent = profile.growthVectors.steadiness || 10;
    document.getElementById('vector-resilience').textContent = profile.growthVectors.resilience || 10;
    document.getElementById('vector-followthrough').textContent = `${profile.growthVectors.actionFollowThrough || 100}%`;

    const listEl = document.getElementById('sankalpa-ledger-list');
    listEl.innerHTML = '';

    const sankalpas = profile.sankalpaLog || [];
    if (sankalpas.length === 0) {
      listEl.innerHTML = '<p style="font-size: 0.85rem; color: var(--ink-muted);">No recorded Sankalpa commitments yet. Complete a reflection to log one.</p>';
      return;
    }

    sankalpas.forEach(s => {
      const item = document.createElement('div');
      item.className = `sankalpa-item ${s.status}`;
      item.innerHTML = `
        <div>
          <div class="sankalpa-text">${s.commitment}</div>
          <div style="font-size: 0.75rem; color: var(--ink-muted);">Logged: ${new Date(s.timestamp * 1000).toLocaleDateString()}</div>
        </div>
        <button class="sankalpa-status-btn" data-id="${s.id}">
          ${s.status === 'completed' ? '✓ Completed' : 'Mark Done'}
        </button>
      `;

      item.querySelector('.sankalpa-status-btn').addEventListener('click', () => {
        const nextStatus = s.status === 'completed' ? 'active' : 'completed';
        accountManager.updateSankalpaStatus(s.id, nextStatus);
        renderGrowthCompass();
      });

      listEl.appendChild(item);
    });
  }

  // Boot on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
