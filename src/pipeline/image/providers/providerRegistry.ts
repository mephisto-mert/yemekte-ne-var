import { ImageProvider } from './types';

/**
 * Deterministic registry for managing active ImageProviders.
 * Prevents global mutable chaos and ensures isolated, testable provider management.
 */
export class ImageProviderRegistry {
  private providers: Map<string, ImageProvider> = new Map();

  /**
   * Registers an ImageProvider in the registry.
   */
  registerProvider(provider: ImageProvider): void {
    if (!provider || !provider.name) {
      throw new Error('Geçersiz ImageProvider: Sağlayıcı adı boş olamaz.');
    }
    this.providers.set(provider.name, provider);
  }

  /**
   * Retrieves an ImageProvider by name.
   */
  getProvider(name: string): ImageProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Retrieves an ImageProvider by name, throwing a controlled error if not found.
   */
  requireProvider(name: string): ImageProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Bilinmeyen ImageProvider: "${name}" kayıtlı değil.`);
    }
    return provider;
  }

  /**
   * Returns a list of all currently registered providers.
   */
  listProviders(): ImageProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Unregisters a provider by name.
   */
  unregisterProvider(name: string): boolean {
    return this.providers.delete(name);
  }

  /**
   * Clears the registry (essential for deterministic test isolation).
   */
  clearRegistry(): void {
    this.providers.clear();
  }
}

/**
 * Shared default registry instance.
 */
export const defaultProviderRegistry = new ImageProviderRegistry();
