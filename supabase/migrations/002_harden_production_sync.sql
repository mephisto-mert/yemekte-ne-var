-- ==============================================================================
-- COOKLY / YEMEKTE NE VAR — DATABASE SYNC & MULTI-TENANT HARDENING
-- Version: 002_harden_production_sync.sql
-- Security: Kernel-level Row-Level Security (RLS) & Multi-Device Concurrency
-- ==============================================================================

-- 1. CUSTOM RECIPES HARDENING (Unique recipe_id per user to prevent duplicates)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'custom_recipes' AND column_name = 'recipe_id'
    ) THEN
        ALTER TABLE public.custom_recipes ADD COLUMN recipe_id TEXT;
        UPDATE public.custom_recipes SET recipe_id = COALESCE(recipe_data->>'id', id::TEXT);
        ALTER TABLE public.custom_recipes ALTER COLUMN recipe_id SET NOT NULL;
    END IF;
END $$;

-- Add unique constraint on (user_id, recipe_id) if not present
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_custom_recipe_id'
    ) THEN
        ALTER TABLE public.custom_recipes 
        ADD CONSTRAINT unique_user_custom_recipe_id UNIQUE (user_id, recipe_id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN null;
    WHEN duplicate_object THEN null;
END $$;

-- 2. SHOPPING ITEMS CONCURRENCY HARDENING
CREATE INDEX IF NOT EXISTS idx_shopping_items_user_id_id ON public.shopping_items(user_id, id);

-- 3. PANTRY CASE NORMALIZATION INDEX
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_ing_lower ON public.pantry_items(user_id, LOWER(ingredient_id));

-- 4. USER STATS UPSERT & LOCKING OPTIMIZATION
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON public.user_stats(user_id);

-- 5. VERIFY AND REINFORCE STRICT ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooked_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Ensure RLS on custom_recipes has explicit full CRUD
DROP POLICY IF EXISTS "Users can view own custom recipes" ON public.custom_recipes;
CREATE POLICY "Users can view own custom recipes" ON public.custom_recipes
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own custom recipes" ON public.custom_recipes;
CREATE POLICY "Users can insert own custom recipes" ON public.custom_recipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own custom recipes" ON public.custom_recipes;
CREATE POLICY "Users can update own custom recipes" ON public.custom_recipes
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own custom recipes" ON public.custom_recipes;
CREATE POLICY "Users can delete own custom recipes" ON public.custom_recipes
    FOR DELETE USING (auth.uid() = user_id);