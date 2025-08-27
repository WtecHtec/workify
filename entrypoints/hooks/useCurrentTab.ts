import { useState, useEffect } from 'react';

export const useCurrentTab = () => {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const getCurrentUrl = async () => {
    setLoading(true);
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        const response = await browser.tabs.sendMessage(tab.id, { type: 'GET_CURRENT_URL' });
        setCurrentUrl(response.url);
      }
    } catch (error) {
      console.error('Failed to get current URL:', error);
      // 如果无法通过消息获取，尝试直接从tab获取
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        setCurrentUrl(tab.url);
      }
    } finally {
      setLoading(false);
    }
  };

  const reloadCurrentTab = async () => {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await browser.tabs.sendMessage(tab.id, { type: 'RELOAD_CONFIG' });
      }
    } catch (error) {
      console.error('Failed to reload tab config:', error);
    }
  };

  useEffect(() => {
    getCurrentUrl();
  }, []);

  return {
    currentUrl,
    loading,
    getCurrentUrl,
    reloadCurrentTab
  };
};