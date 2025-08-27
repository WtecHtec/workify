import type { GlobalConfig, DomainConfig } from '../types/config';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: GlobalConfig;

  private constructor() {
    this.config = {
      domains: []
    };
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  async loadConfig(): Promise<GlobalConfig> {
    const result = await browser.storage.sync.get('workifyConfig');
    if (result.workifyConfig) {
      this.config = result.workifyConfig;
    }
    return this.config;
  }

  async saveConfig(): Promise<void> {
    await browser.storage.sync.set({ workifyConfig: this.config });
  }

  getConfig(): GlobalConfig {
    return this.config;
  }

  addDomain(domain: string): DomainConfig {
    const newDomain: DomainConfig = {
      id: Date.now().toString(),
      domain,
      elementConfigs: []
    };
    this.config.domains.push(newDomain);
    return newDomain;
  }

  updateDomain(domainId: string, updates: Partial<DomainConfig>): void {
    const index = this.config.domains.findIndex(d => d.id === domainId);
    if (index !== -1) {
      this.config.domains[index] = { ...this.config.domains[index], ...updates };
    }
  }

  deleteDomain(domainId: string): void {
    this.config.domains = this.config.domains.filter(d => d.id !== domainId);
  }

  findDomainByUrl(url: string): DomainConfig | undefined {
    return this.config.domains.find(domain => {
      try {
        const regex = new RegExp(domain.domain);
        return regex.test(url);
      } catch {
        return url.includes(domain.domain);
      }
    });
  }
}