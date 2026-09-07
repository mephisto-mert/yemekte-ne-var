import { RecipeProvider } from './types';

/**
 * Deterministic Registry for managing Recipe Source Providers.
 * Ensures modular, isolated, testable provider management.
 */
export class RecipeProviderRegistry {
  private providers: Map<string, RecipeProvider> = new Map();

  registerProvider(provider: RecipeProvider): void {
    if (!provider || !provider.id) {
      throw new Error('Geçersiz RecipeProvider: Sağlayıcı kimliği (id) boş olamaz.');
    }
    this.providers.set(provider.id, provider);
  }

  getProvider(id: string): RecipeProvider | undefined {
    return this.providers.get(id);
  }

  requireProvider(id: string): RecipeProvider {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`Bilinmeyen RecipeProvider: "${id}" kayıtlı değil.`);
    }
    return provider;
  }

  listProviders(): RecipeProvider[] {
    return Array.from(this.providers.values());
  }

  unregisterProvider(id: string): boolean {
    return this.providers.delete(id);
  }

  clearRegistry(): void {
    this.providers.clear();
  }
}

export const defaultRecipeProviderRegistry = new RecipeProviderRegistry();
