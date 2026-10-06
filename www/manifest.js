/**
 * VivekMarg Mentor - Module 6: Closing Affirmation Player (manifest.js)
 * Full-screen, dark-mode meditative canvas reel with dynamic audio-sync
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VivekManifest = factory();
  }
}(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  class AffirmationPlayer {
    constructor(speechEngine) {
      this.speech = speechEngine;
      this.cards = [];
      this.currentIndex = 0;
      this.isPlaying = false;
      this.timerId = null;
      this.containerEl = null;
      this.canvasEl = null;
      this.canvasCtx = null;
      this.animationFrameId = null;
      this.particles = [];
      this.onComplete = null;
    }

    // Initialize DOM and Canvas structures
    initDOM() {
      if (typeof document === 'undefined') return;
      let container = document.getElementById('affirmation-modal');
      if (!container) {
        container = document.createElement('div');
        container.id = 'affirmation-modal';
        container.className = 'affirmation-modal hidden';
        container.innerHTML = `
          <div class="affirmation-backdrop">
            <canvas id="affirmation-canvas"></canvas>
            <div class="affirmation-content-wrap">
              <div class="affirmation-top-bar">
                <span class="affirmation-badge" id="aff-card-progress">Card 1 of 4</span>
                <button class="icon-btn close-aff-btn" id="aff-close-btn" aria-label="Close Affirmation Reel">✕</button>
              </div>
              <div class="affirmation-card" id="aff-card-body">
                <div class="aff-category" id="aff-card-category">Grounding Principle</div>
                <h2 class="aff-text" id="aff-card-text">Loading reflection...</h2>
                <div class="aff-meta" id="aff-card-meta">Complete Works of Swami Vivekananda</div>
              </div>
              <div class="affirmation-controls">
                <button class="aff-ctrl-btn" id="aff-prev-btn" aria-label="Previous Card">⟨ Prev</button>
                <button class="aff-ctrl-btn aff-play-btn" id="aff-play-toggle" aria-label="Pause or Play">Pause</button>
                <button class="aff-ctrl-btn" id="aff-next-btn" aria-label="Next Card">Next ⟩</button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(container);
      }

      this.containerEl = container;
      this.canvasEl = document.getElementById('affirmation-canvas');
      if (this.canvasEl) {
        this.canvasCtx = this.canvasEl.getContext('2d');
        this.setupCanvas();
      }

      // Event bindings
      document.getElementById('aff-close-btn')?.addEventListener('click', () => this.stop());
      document.getElementById('aff-prev-btn')?.addEventListener('click', () => this.prevCard());
      document.getElementById('aff-next-btn')?.addEventListener('click', () => this.nextCard());
      document.getElementById('aff-play-toggle')?.addEventListener('click', () => this.togglePlay());
    }

    setupCanvas() {
      if (!this.canvasEl) return;
      const dpr = window.devicePixelRatio || 1;
      this.canvasEl.width = window.innerWidth * dpr;
      this.canvasEl.height = window.innerHeight * dpr;
      this.canvasCtx.scale(dpr, dpr);

      // Create ambient warm ochre / gold particles
      this.particles = [];
      for (let i = 0; i < 35; i++) {
        this.particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          radius: Math.random() * 2.5 + 0.8,
          speedY: -(Math.random() * 0.4 + 0.15),
          speedX: (Math.random() - 0.5) * 0.2,
          opacity: Math.random() * 0.6 + 0.2
        });
      }
    }

    startAnimation() {
      if (!this.canvasCtx) return;
      const w = window.innerWidth;
      const h = window.innerHeight;

      const render = () => {
        this.canvasCtx.clearRect(0, 0, w, h);

        // Draw radial warm monastic glow
        const grad = this.canvasCtx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h));
        grad.addColorStop(0, 'rgba(163, 90, 18, 0.18)');
        grad.addColorStop(0.6, 'rgba(28, 25, 23, 0.94)');
        grad.addColorStop(1, 'rgba(12, 10, 9, 0.99)');
        this.canvasCtx.fillStyle = grad;
        this.canvasCtx.fillRect(0, 0, w, h);

        // Render subtle sacred geometry rings
        this.canvasCtx.save();
        this.canvasCtx.strokeStyle = 'rgba(218, 165, 32, 0.08)';
        this.canvasCtx.lineWidth = 1;
        this.canvasCtx.beginPath();
        this.canvasCtx.arc(w / 2, h / 2, 140, 0, Math.PI * 2);
        this.canvasCtx.stroke();
        this.canvasCtx.beginPath();
        this.canvasCtx.arc(w / 2, h / 2, 220, 0, Math.PI * 2);
        this.canvasCtx.stroke();
        this.canvasCtx.restore();

        // Render particles
        for (const p of this.particles) {
          this.canvasCtx.fillStyle = `rgba(248, 239, 214, ${p.opacity})`;
          this.canvasCtx.beginPath();
          this.canvasCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          this.canvasCtx.fill();

          p.y += p.speedY;
          p.x += p.speedX;

          if (p.y < -10) {
            p.y = h + 10;
            p.x = Math.random() * w;
          }
          if (p.x < 0 || p.x > w) p.x = Math.random() * w;
        }

        if (this.isPlaying) {
          this.animationFrameId = requestAnimationFrame(render);
        }
      };

      this.animationFrameId = requestAnimationFrame(render);
    }

    // Build the 4-5 affirmation cards
    buildCards({ dilemma, chunk, sankalpa, userProfile }) {
      const salutation = userProfile ? (userProfile.salutation || 'Seeker') : 'Seeker';

      const cards = [
        // 1. The Stated Dilemma Reframed
        {
          category: 'THE OBSERVED SITUATION',
          text: `"${dilemma || 'I will confront my current challenge with unwavering presence.'}"`,
          meta: `Reframed objectively for ${salutation}`,
          speechText: `You have examined your challenge: ${dilemma}. Let reality stand clear of emotional distress.`
        },

        // 2. The Grounding Principle
        {
          category: 'THE GROUNDING PRINCIPLE',
          text: chunk ? chunk.paragraph : 'Strength is life, weakness is death. You are the infinite Spirit, pure, luminous, and deathless.',
          meta: chunk ? `Complete Works Vol. ${chunk.volume}, p. ${chunk.page} — ${chunk.title}` : 'Complete Works of Swami Vivekananda',
          speechText: chunk ? chunk.paragraph : 'Strength is life, weakness is death. Stand up and express the divinity within you.'
        },

        // 3. The User's Sankalpa
        {
          category: 'YOUR UNBROKEN SANKALPA',
          text: sankalpa || 'I will focus with complete presence on my immediate duty.',
          meta: 'Daily Micro-Commitment',
          speechText: `Your sacred commitment today is: ${sankalpa || 'to focus completely on the immediate duty in front of you.'}`
        },

        // 4. The Integration Anchor
        {
          category: 'INNER FREEDOM & DUTY',
          text: 'To work you have the right, but never to the fruits thereof. Plunge into your effort with tranquility.',
          meta: 'Karma-Yoga: The Secret of Work',
          speechText: 'To work you have the right, but never to the fruits thereof. Let your action be wholehearted and serene.'
        },

        // 5. Authenticity Colophon
        {
          category: 'AUTHENTICITY COLOPHON',
          text: 'These grounding reflections originate directly from the historical texts of the Complete Works. Inner strength arises from your own nature.',
          meta: 'VivekMarg Mentor — Zero Cloud, On-Device Growth',
          speechText: 'These principles originate from the historical Complete Works. Manifest the strength already within you.'
        }
      ];

      return cards;
    }

    // Launch Affirmation Player
    start(sessionData) {
      this.initDOM();
      this.cards = this.buildCards(sessionData);
      this.currentIndex = 0;
      this.isPlaying = true;

      if (this.containerEl) {
        this.containerEl.classList.remove('hidden');
      }

      this.startAnimation();
      this.displayCard(0);
    }

    displayCard(index) {
      if (index < 0 || index >= this.cards.length) return;
      this.currentIndex = index;
      const card = this.cards[index];

      const progressEl = document.getElementById('aff-card-progress');
      const catEl = document.getElementById('aff-card-category');
      const textEl = document.getElementById('aff-card-text');
      const metaEl = document.getElementById('aff-card-meta');

      if (progressEl) progressEl.textContent = `Card ${index + 1} of ${this.cards.length}`;
      if (catEl) catEl.textContent = card.category;
      if (textEl) textEl.textContent = card.text;
      if (metaEl) metaEl.textContent = card.meta;

      // Clear any pending timer
      if (this.timerId) clearTimeout(this.timerId);

      // Auto-advance calculation: 6.5s to 12s based on word count
      const wordCount = (card.speechText || card.text).split(/\s+/).length;
      const durationMs = Math.max(6500, Math.min(13000, wordCount * 380));

      if (this.speech && this.isPlaying) {
        this.speech.speak(card.speechText || card.text, { rate: 0.88 });
      }

      if (this.isPlaying) {
        this.timerId = setTimeout(() => {
          if (this.currentIndex < this.cards.length - 1) {
            this.displayCard(this.currentIndex + 1);
          } else {
            this.stop();
            if (this.onComplete) this.onComplete();
          }
        }, durationMs);
      }
    }

    nextCard() {
      if (this.currentIndex < this.cards.length - 1) {
        this.displayCard(this.currentIndex + 1);
      } else {
        this.stop();
      }
    }

    prevCard() {
      if (this.currentIndex > 0) {
        this.displayCard(this.currentIndex - 1);
      }
    }

    togglePlay() {
      this.isPlaying = !this.isPlaying;
      const btn = document.getElementById('aff-play-toggle');
      if (btn) btn.textContent = this.isPlaying ? 'Pause' : 'Play';

      if (this.isPlaying) {
        this.startAnimation();
        this.displayCard(this.currentIndex);
      } else {
        if (this.timerId) clearTimeout(this.timerId);
        if (this.speech) this.speech.stop();
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
      }
    }

    stop() {
      this.isPlaying = false;
      if (this.timerId) clearTimeout(this.timerId);
      if (this.speech) this.speech.stop();
      if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);

      if (this.containerEl) {
        this.containerEl.classList.add('hidden');
      }
    }
  }

  return {
    AffirmationPlayer
  };
}));
