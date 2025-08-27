import { useState, useEffect } from 'react';
import { ConfigManager } from '../utils/ConfigManager';
import type { GlobalConfig, DomainConfig } from '../types/config';

export const useConfig = () => {
  const [config, setConfig] = useState<GlobalConfig>({ domains: [] });
  const [loading, setLoading] = useState(true);
  const configManager = ConfigManager.getInstance();

  const loadConfig = async () => {
    setLoading(true);
    try {
      const loadedConfig = await configManager.loadConfig();
      setConfig(loadedConfig);
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      await configManager.saveConfig();
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  };

  const addDomain = async (domain: string) => {
    const newDomain = configManager.addDomain(domain);
    await saveConfig();
    setConfig(configManager.getConfig());
    return newDomain;
  };

  const updateDomain = async (domainId: string, updates: Partial<DomainConfig>) => {
    try {
      console.log('Updating domain:', domainId, updates);
      configManager.updateDomain(domainId, updates);
      await saveConfig();
      const updatedConfig = configManager.getConfig();
      console.log('Updated config after update:', updatedConfig);
      setConfig(updatedConfig);
      await loadConfig();
    } catch (error) {
      console.error('Failed to update domain:', error);
      alert('更新域名配置失败，请重试');
    }
  };

  const deleteDomain = async (domainId: string) => {
    try {
      console.log('Deleting domain:', domainId);
      configManager.deleteDomain(domainId);
      await saveConfig();
      const updatedConfig = configManager.getConfig();
      console.log('Updated config after deletion:', updatedConfig);
      setConfig(updatedConfig);
      await loadConfig();
    } catch (error) {
      console.error('Failed to delete domain:', error);
      alert('删除域名失败，请重试');
    }
  };

  const findDomainByUrl = (url: string) => {
    return configManager.findDomainByUrl(url);
  };

  useEffect(() => {
    loadConfig();
  }, []);

  return {
    config,
    loading,
    addDomain,
    updateDomain,
    deleteDomain,
    findDomainByUrl,
    reload: loadConfig
  };
};