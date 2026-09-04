import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { StripeService, PRICING_TIERS, FREE_CUSTOM_RECIPE_LIMIT } from '../services/stripeService';
import { StorageService } from '../services/storageService';
import { cloudSync } from '../services/cloudSyncService';
import { isSupabaseConfigured } from '../services/supabaseClient';

describe('SaaS Transformation & Cloud Architecture Test Suite', () => {
  // Mock localStorage for test environment
  const mockStorage: Record<string, string> = {};

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, val: string) => {
        mockStorage[key] = val;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        for (const k in mockStorage) delete mockStorage[k];
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // 1. STRIPE BILLING & SUBSCRIPTION TIER GATES
  // ============================================================================
  describe('Subscription Tier Limits & Gating', () => {
    it('enforces free tier limit on custom recipes', () => {
      // 0 custom recipes
      const check0 = StripeService.canCreateCustomRecipe(0, false);
      expect(check0.allowed).toBe(true);
      expect(check0.remaining).toBe(5);
      expect(check0.limit).toBe(FREE_CUSTOM_RECIPE_LIMIT);

      // 4 custom recipes
      const check4 = StripeService.canCreateCustomRecipe(4, false);
      expect(check4.allowed).toBe(true);
      expect(check4.remaining).toBe(1);

      // 5 custom recipes (reached limit)
      const check5 = StripeService.canCreateCustomRecipe(5, false);
      expect(check5.allowed).toBe(false);
      expect(check5.remaining).toBe(0);

      // 10 custom recipes (exceeded limit)
      const check10 = StripeService.canCreateCustomRecipe(10, false);
      expect(check10.allowed).toBe(false);
      expect(check10.remaining).toBe(0);
    });

    it('allows unlimited custom recipes for PRO tier', () => {
      const checkPro0 = StripeService.canCreateCustomRecipe(0, true);
      expect(checkPro0.allowed).toBe(true);
      expect(checkPro0.remaining).toBe(Infinity);

      const checkPro5 = StripeService.canCreateCustomRecipe(5, true);
      expect(checkPro5.allowed).toBe(true);
      expect(checkPro5.remaining).toBe(Infinity);

      const checkPro500 = StripeService.canCreateCustomRecipe(500, true);
      expect(checkPro500.allowed).toBe(true);
      expect(checkPro500.remaining).toBe(Infinity);
    });

    it('validates pricing tiers data model integrity', () => {
      expect(PRICING_TIERS.length).toBeGreaterThanOrEqual(3);
      
      const freeTier = PRICING_TIERS.find(p => p.id === 'free');
      expect(freeTier).toBeDefined();
      expect(freeTier?.price).toBe('₺0');
      expect(freeTier?.features.length).toBeGreaterThan(5);

      const proMonthly = PRICING_TIERS.find(p => p.id === 'pro_monthly');
      expect(proMonthly).toBeDefined();
      expect(proMonthly?.price).toBe('₺79');
      expect(proMonthly?.highlight).toBe(true);

      const proAnnual = PRICING_TIERS.find(p => p.id === 'pro_annual');
      expect(proAnnual).toBeDefined();
      expect(proAnnual?.price).toBe('₺699');
      expect(proAnnual?.badge).toBeDefined();
    });

    it('simulates checkout completion for demo mode', async () => {
      const res = await StripeService.startCheckout('pro_monthly', 'chef@cookly.app');
      expect(res.success).toBe(true);
      expect(res.message).toContain('Cookly PRO');
    });
  });

  // ============================================================================
  // 2. GUEST-TO-CLOUD RECONCILIATION ENGINE
  // ============================================================================
  describe('Guest-to-Cloud Data Reconciliation', () => {
    it('reconciles guest local storage data smoothly when offline/fallback', async () => {
      // Setup mock guest pantry
      StorageService.savePantry([
        { id: 'item-1', name: 'Domates', addedDate: '2026-09-01T00:00:00Z' },
        { id: 'item-2', name: 'Zeytinyağı', addedDate: '2026-09-01T00:00:00Z' }
      ]);

      const result = await cloudSync.reconcileOnLogin('test-user-123');
      expect(result.pantry).toHaveLength(2);
      expect(result.pantry[0].name).toBe('Domates');
      expect(result.pantry[1].name).toBe('Zeytinyağı');
      expect(result.favorites).toBeDefined();
      expect(result.shopping).toBeDefined();
    });

    it('sync status tracker reports correctly to subscribers', () => {
      let latestStatus: any = null;
      const unsubscribe = cloudSync.subscribe((status) => {
        latestStatus = status;
      });

      expect(latestStatus).toBeDefined();
      expect(typeof latestStatus.isSyncing).toBe('boolean');
      expect(latestStatus.hasConflicts).toBe(false);

      unsubscribe();
    });
  });

  // ============================================================================
  // 3. ZERO-TRUST POSTGRESQL RLS MIGRATION AUDIT
  // ============================================================================
  describe('PostgreSQL Migration & Zero-Trust RLS Verification', () => {
    const migrationPath = path.resolve(__dirname, '../../supabase/migrations/001_commercial_saas_schema.sql');

    it('verifies migration file exists and is populated', () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      expect(sql.length).toBeGreaterThan(1000);
    });

    it('verifies Row-Level Security is explicitly enabled on all core tables', () => {
      const sql = fs.readFileSync(migrationPath, 'utf8');
      const requiredTables = [
        'profiles',
        'pantry_items',
        'favorites',
        'shopping_items',
        'meal_plans',
        'custom_recipes',
        'cooked_history',
        'user_stats',
        'subscriptions'
      ];

      requiredTables.forEach((table) => {
        const rlsRegex = new RegExp(`ALTER\\s+TABLE\\s+public\\.${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i');
        expect(rlsRegex.test(sql), `Missing RLS enable for table: ${table}`).toBe(true);
      });
    });

    it('verifies strict auth.uid() isolation policies exist for all user data', () => {
      const sql = fs.readFileSync(migrationPath, 'utf8');
      expect(sql).toMatch(/auth\.uid\(\)\s*=\s*user_id/i);
      expect(sql).toMatch(/auth\.uid\(\)\s*=\s*id/i);
      expect(sql).toMatch(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.handle_new_user\(\)/i);
      expect(sql).toMatch(/CREATE\s+TRIGGER\s+on_auth_user_created/i);
    });
  });

  // ============================================================================
  // 4. PROGRESSIVE WEB APP (PWA) MANIFEST & SERVICE WORKER
  // ============================================================================
  describe('PWA Manifest & Service Worker Specifications', () => {
    const manifestPath = path.resolve(__dirname, '../../public/manifest.json');
    const swPath = path.resolve(__dirname, '../../public/sw.js');

    it('verifies manifest.json is compliant with PWA specifications', () => {
      expect(fs.existsSync(manifestPath)).toBe(true);
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

      expect(manifest.name).toBe('Cookly — Akıllı Mutfak Asistanı');
      expect(manifest.short_name).toBe('Cookly');
      expect(manifest.display).toBe('standalone');
      expect(manifest.start_url).toBe('./');
      expect(manifest.icons).toBeDefined();
      expect(manifest.icons.length).toBeGreaterThan(0);
      expect(manifest.shortcuts).toBeDefined();
      expect(manifest.shortcuts.length).toBe(3);
    });

    it('verifies service worker sw.js implements Cache-First and network routing', () => {
      expect(fs.existsSync(swPath)).toBe(true);
      const swCode = fs.readFileSync(swPath, 'utf8');

      expect(swCode).toContain('caches.open');
      expect(swCode).toContain('caches.match');
      expect(swCode).toContain('fetch(event.request)');
      expect(swCode).toContain('supabase');
    });
  });

  // ============================================================================
  // 5. CI/CD WORKFLOW & ENVIRONMENT SECURITY
  // ============================================================================
  describe('DevOps & Environment Security Verification', () => {
    const ciPath = path.resolve(__dirname, '../../.github/workflows/ci.yml');
    const envExamplePath = path.resolve(__dirname, '../../.env.example');

    it('verifies GitHub Actions CI workflow file exists and runs tests & build', () => {
      expect(fs.existsSync(ciPath)).toBe(true);
      const ci = fs.readFileSync(ciPath, 'utf8');
      expect(ci).toContain('npm test');
      expect(ci).toContain('npm run build');
    });

    it('verifies .env.example exists and contains no leaked real private secrets', () => {
      expect(fs.existsSync(envExamplePath)).toBe(true);
      const envExample = fs.readFileSync(envExamplePath, 'utf8');
      expect(envExample).toContain('VITE_SUPABASE_URL');
      expect(envExample).toContain('VITE_SUPABASE_ANON_KEY');
      expect(envExample).toContain('VITE_STRIPE_PUBLISHABLE_KEY');

      // Ensure no leaked actual private API key values
      expect(envExample).not.toMatch(/sk_live_[a-zA-Z0-9]{20,}/);
      expect(envExample).not.toMatch(/whsec_[a-zA-Z0-9]{20,}/);
    });
  });
});
