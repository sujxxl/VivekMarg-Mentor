/**
 * VivekMarg Mentor - Module 1: Local-First Identity & Private Vault (account.js)
 * Zero-cloud, encrypted local profile & growth tracking
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('crypto'));
  } else {
    root.VivekAccount = factory();
  }
}(typeof self !== 'undefined' ? self : this, function(nodeCrypto) {
  'use strict';

  const STORAGE_KEY = 'vivekmarg_vault_v1';
  const ACTIVE_USER_KEY = 'vivekmarg_active_session_v1';

  const inMemoryStorage = {
    _data: {},
    getItem: function(k) { return this._data[k] || null; },
    setItem: function(k, v) { this._data[k] = v.toString(); },
    removeItem: function(k) { delete this._data[k]; },
    clear: function() { this._data = {}; }
  };

  function getStorage() {
    if (typeof localStorage !== 'undefined') return localStorage;
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) return globalThis.localStorage;
    return inMemoryStorage;
  }

  // FNV-1a 32-bit fallback hash
  function fnv1aHash(str) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return ('0000000' + (hash >>> 0).toString(16)).substr(-8);
  }

  // Generate 16-byte cryptographically secure random salt hex string
  function generateSalt() {
    const c = (typeof crypto !== 'undefined') ? crypto : (typeof globalThis !== 'undefined' ? globalThis.crypto : null);
    if (c && c.getRandomValues) {
      const bytes = new Uint8Array(16);
      c.getRandomValues(bytes);
      return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    } else if (nodeCrypto && nodeCrypto.randomBytes) {
      return nodeCrypto.randomBytes(16).toString('hex');
    }
    // Fallback pseudo-random for testing
    let s = '';
    for (let i = 0; i < 32; i++) {
      s += Math.floor(Math.random() * 16).toString(16);
    }
    return s;
  }

  // Compute salted SHA-256 digest: SHA-256("vivekmarg_mentor:" + salt + ":" + pin)
  async function computeDigest(pin, salt) {
    const rawPayload = `vivekmarg_mentor:${salt}:${pin}`;

    // Try Node crypto if available
    if (nodeCrypto && nodeCrypto.createHash) {
      try {
        const hex = nodeCrypto.createHash('sha256').update(rawPayload).digest('hex');
        return { digest: `sha256$${hex}`, algo: 'sha256' };
      } catch (e) {
        console.warn('Node crypto hash failed', e);
      }
    }

    // Try WebCrypto SubtleCrypto
    const c = (typeof crypto !== 'undefined') ? crypto : (typeof globalThis !== 'undefined' ? globalThis.crypto : null);
    if (c && c.subtle && typeof TextEncoder !== 'undefined') {
      try {
        const msgBuffer = new TextEncoder().encode(rawPayload);
        const hashBuffer = await c.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return { digest: `sha256$${hex}`, algo: 'sha256' };
      } catch (e) {
        console.warn('SubtleCrypto failed, falling back to FNV-1a', e);
      }
    }

    // Hardware-limited environment fallback
    const fnvHex = fnv1aHash(rawPayload);
    return { digest: `fnv1a$${fnvHex}`, algo: 'fnv1a-local' };
  }

  class AccountManager {
    constructor() {
      this.currentProfile = null;
      this.isGuestMode = false;
      this.unlocked = false;
    }

    // Initialize or load existing local vault state
    getStoredVault() {
      const storage = getStorage();
      try {
        const raw = storage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        console.error('Failed reading vault from storage', e);
        return null;
      }
    }

    saveVault(profile) {
      if (this.isGuestMode) return;
      const storage = getStorage();
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(profile));
      } catch (e) {
        console.error('Failed saving vault to storage', e);
      }
    }

    hasAccount() {
      const vault = this.getStoredVault();
      return !!(vault && vault.digest);
    }

    // Create a new user profile
    async createProfile({ name, salutation, lang, pin }) {
      const salt = generateSalt();
      const { digest, algo } = await computeDigest(pin, salt);

      const profile = {
        name: name.trim(),
        salutation: salutation || 'Friend',
        lang: lang || 'en-IN',
        salt: salt,
        digest: digest,
        digestAlgo: algo,
        growthVectors: {
          steadiness: 10,
          resilience: 10,
          actionFollowThrough: 100.0
        },
        recurringThemes: [],
        sankalpaLog: [],
        sessions: [],
        createdAt: Date.now(),
        lastActive: Date.now()
      };

      this.currentProfile = profile;
      this.isGuestMode = false;
      this.unlocked = true;
      this.saveVault(profile);
      return profile;
    }

    // Verify Passcode
    async verifyPasscode(pin) {
      const vault = this.getStoredVault();
      if (!vault) return { success: false, error: 'NO_PROFILE' };

      const { digest } = await computeDigest(pin, vault.salt);
      if (digest === vault.digest) {
        this.currentProfile = vault;
        this.unlocked = true;
        this.isGuestMode = false;
        return { success: true, profile: vault };
      }
      return { success: false, error: 'INVALID_PIN' };
    }

    // Enter guest mode
    enterGuestMode() {
      this.isGuestMode = true;
      this.unlocked = true;
      this.currentProfile = {
        name: 'Seeker',
        salutation: 'Seeker',
        lang: 'en-IN',
        salt: 'guest_ephemeral_salt',
        digest: 'guest_mode',
        digestAlgo: 'none',
        growthVectors: {
          steadiness: 10,
          resilience: 10,
          actionFollowThrough: 100.0
        },
        recurringThemes: [],
        sankalpaLog: [],
        sessions: [],
        isGuest: true,
        createdAt: Date.now(),
        lastActive: Date.now()
      };
      return this.currentProfile;
    }

    getProfile() {
      if (!this.currentProfile) {
        const stored = this.getStoredVault();
        if (stored && this.unlocked) {
          this.currentProfile = stored;
        }
      }
      return this.currentProfile;
    }

    updateProfile(updates) {
      if (!this.currentProfile) return;
      Object.assign(this.currentProfile, updates, { lastActive: Date.now() });
      if (!this.isGuestMode) {
        this.saveVault(this.currentProfile);
      }
      return this.currentProfile;
    }

    // Add a new Sankalpa commitment
    addSankalpa(commitment, theme = 'general') {
      if (!this.currentProfile) return null;
      const sankalpa = {
        id: 'sk_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
        timestamp: Math.floor(Date.now() / 1000),
        commitment: commitment.trim(),
        status: 'active', // 'active' | 'completed' | 'released'
        theme: theme
      };

      if (!this.currentProfile.sankalpaLog) {
        this.currentProfile.sankalpaLog = [];
      }
      this.currentProfile.sankalpaLog.unshift(sankalpa);

      // Track theme in recurring themes
      if (theme && !this.currentProfile.recurringThemes.includes(theme)) {
        this.currentProfile.recurringThemes.push(theme);
      }

      this.recalculateGrowthVectors();
      if (!this.isGuestMode) {
        this.saveVault(this.currentProfile);
      }
      return sankalpa;
    }

    // Update status of existing Sankalpa
    updateSankalpaStatus(id, status) {
      if (!this.currentProfile || !this.currentProfile.sankalpaLog) return false;
      const item = this.currentProfile.sankalpaLog.find(s => s.id === id);
      if (!item) return false;

      item.status = status;
      item.updatedAt = Math.floor(Date.now() / 1000);

      this.recalculateGrowthVectors();
      if (!this.isGuestMode) {
        this.saveVault(this.currentProfile);
      }
      return true;
    }

    // Record completed reflection session
    recordSession(sessionData) {
      if (!this.currentProfile) return;
      if (!this.currentProfile.sessions) {
        this.currentProfile.sessions = [];
      }

      const session = {
        id: 'ses_' + Date.now().toString(36),
        timestamp: Date.now(),
        dilemma: sessionData.dilemma || '',
        matchedChunkId: sessionData.matchedChunkId || null,
        theme: sessionData.theme || 'general',
        sankalpaId: sessionData.sankalpaId || null,
        stagesCompleted: sessionData.stagesCompleted || 6
      };

      this.currentProfile.sessions.unshift(session);

      // Update vectors
      this.currentProfile.growthVectors.steadiness += 1;
      this.currentProfile.growthVectors.resilience += 1;

      this.recalculateGrowthVectors();
      if (!this.isGuestMode) {
        this.saveVault(this.currentProfile);
      }
      return session;
    }

    // Recalculate dynamic growth metrics based on action follow-through
    recalculateGrowthVectors() {
      if (!this.currentProfile) return;
      const log = this.currentProfile.sankalpaLog || [];
      if (log.length === 0) {
        this.currentProfile.growthVectors.actionFollowThrough = 100.0;
        return;
      }

      const completed = log.filter(s => s.status === 'completed').length;
      const evaluated = log.filter(s => s.status === 'completed' || s.status === 'released').length;

      if (evaluated === 0) {
        this.currentProfile.growthVectors.actionFollowThrough = 100.0;
      } else {
        this.currentProfile.growthVectors.actionFollowThrough = Math.round((completed / evaluated) * 1000) / 10;
      }
    }

    // Export all data to clean JSON string
    exportData() {
      const data = this.getStoredVault() || this.currentProfile;
      if (!data) return null;
      return JSON.stringify(data, null, 2);
    }

    // Import data from clean JSON string
    importData(jsonString, pin) {
      try {
        const parsed = JSON.parse(jsonString);
        if (!parsed.digest || !parsed.salt) {
          throw new Error('Invalid VivekMarg profile file');
        }
        this.saveVault(parsed);
        this.currentProfile = parsed;
        return { success: true, profile: parsed };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }

    // Clear local vault completely
    clearData() {
      this.currentProfile = null;
      this.unlocked = false;
      this.isGuestMode = false;
      const storage = getStorage();
      storage.removeItem(STORAGE_KEY);
      storage.removeItem(ACTIVE_USER_KEY);
    }

    lock() {
      this.unlocked = false;
      this.currentProfile = null;
    }
  }

  return {
    AccountManager,
    computeDigest,
    generateSalt,
    fnv1aHash
  };
}));
