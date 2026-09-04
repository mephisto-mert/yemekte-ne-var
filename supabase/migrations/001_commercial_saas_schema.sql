-- ==============================================================================
-- COOKLY / YEMEKTE NE VAR — COMMERCIAL SaaS DATABASE MIGRATION
-- Version: 001_commercial_saas_schema.sql
-- Security: Kernel-level PostgreSQL Row-Level Security (RLS)
-- Standard: Zero-Trust Multi-Tenancy (auth.uid() = user_id)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
    CREATE TYPE subscription_tier_enum AS ENUM ('free', 'pro', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE meal_slot_enum AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    dietary_preference TEXT DEFAULT 'all',
    allergens TEXT[] DEFAULT ARRAY[]::TEXT[],
    subscription_tier subscription_tier_enum DEFAULT 'free',
    subscription_status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PANTRY ITEMS (Multi-tenant Pantry)
CREATE TABLE IF NOT EXISTS public.pantry_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ingredient_id TEXT NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_ingredient UNIQUE (user_id, ingredient_id)
);

-- 5. FAVORITES (User Recipe Favorites)
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_favorite UNIQUE (user_id, recipe_id)
);

-- 6. SHOPPING ITEMS (User Shopping List)
CREATE TABLE IF NOT EXISTS public.shopping_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount NUMERIC DEFAULT 1,
    unit TEXT DEFAULT 'adet',
    recipe_origin TEXT,
    checked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. MEAL PLANS (Weekly Planner)
CREATE TABLE IF NOT EXISTS public.meal_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_index INTEGER NOT NULL CHECK (day_index >= 0 AND day_index <= 6),
    meal_slot meal_slot_enum NOT NULL DEFAULT 'dinner',
    recipe_id TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_day_slot UNIQUE (user_id, day_index, meal_slot)
);

-- 8. CUSTOM RECIPES (User Created Recipes)
CREATE TABLE IF NOT EXISTS public.custom_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. COOKED HISTORY (Cooking Log & Badges Verification)
CREATE TABLE IF NOT EXISTS public.cooked_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id TEXT NOT NULL,
    recipe_name TEXT NOT NULL,
    cooked_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. USER STATS (XP, Streaks, Gamification)
CREATE TABLE IF NOT EXISTS public.user_stats (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
    streak INTEGER NOT NULL DEFAULT 0 CHECK (streak >= 0),
    last_cooked_date TEXT,
    unlocked_badges TEXT[] DEFAULT ARRAY[]::TEXT[],
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. SUBSCRIPTIONS (Stripe Commercial Billing)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_price_id TEXT,
    status TEXT NOT NULL DEFAULT 'inactive',
    plan subscription_tier_enum NOT NULL DEFAULT 'free',
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR HIGH-THROUGHPUT MULTI-TENANT QUERY OPTIMIZATION
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_id ON public.pantry_items(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_user_id ON public.shopping_items(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON public.meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_recipes_user_id ON public.custom_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_cooked_history_user_id ON public.cooked_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES — ZERO-TRUST MULTI-TENANCY
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooked_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and update only their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Pantry Items: Full CRUD restricted to owner
CREATE POLICY "Users can view own pantry" ON public.pantry_items
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pantry" ON public.pantry_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pantry" ON public.pantry_items
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pantry" ON public.pantry_items
    FOR DELETE USING (auth.uid() = user_id);

-- Favorites: Full CRUD restricted to owner
CREATE POLICY "Users can view own favorites" ON public.favorites
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON public.favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Shopping Items: Full CRUD restricted to owner
CREATE POLICY "Users can view own shopping items" ON public.shopping_items
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own shopping items" ON public.shopping_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shopping items" ON public.shopping_items
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shopping items" ON public.shopping_items
    FOR DELETE USING (auth.uid() = user_id);

-- Meal Plans: Full CRUD restricted to owner
CREATE POLICY "Users can view own meal plans" ON public.meal_plans
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meal plans" ON public.meal_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meal plans" ON public.meal_plans
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meal plans" ON public.meal_plans
    FOR DELETE USING (auth.uid() = user_id);

-- Custom Recipes: Full CRUD restricted to owner
CREATE POLICY "Users can view own custom recipes" ON public.custom_recipes
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own custom recipes" ON public.custom_recipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own custom recipes" ON public.custom_recipes
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own custom recipes" ON public.custom_recipes
    FOR DELETE USING (auth.uid() = user_id);

-- Cooked History: Restricted to owner
CREATE POLICY "Users can view own cooking history" ON public.cooked_history
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cooking history" ON public.cooked_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Stats: View and update own stats
CREATE POLICY "Users can view own stats" ON public.user_stats
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own stats" ON public.user_stats
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stats" ON public.user_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subscriptions: Read-only for authenticated user; Writes handled by Service Role (Stripe Webhook)
CREATE POLICY "Users can view own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATED USER REGISTRATION TRIGGER
-- Automatically create profile and stats rows upon auth.users sign-up
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_stats (user_id, xp, streak, unlocked_badges)
    VALUES (NEW.id, 0, 0, ARRAY[]::TEXT[])
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.subscriptions (user_id, status, plan)
    VALUES (NEW.id, 'active', 'free')
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
