import { ConfigManager } from './utils/ConfigManager';

export default defineBackground(() => {
  const configManager = ConfigManager.getInstance();

  // 处理插件图标点击
  browser.action.onClicked.addListener(async (tab) => {
    if (tab.id) {
      // 打开侧边面板
      await browser.sidePanel.open({ tabId: tab.id });
    }
  });

  // 处理快捷键命令
  browser.commands.onCommand.addListener(async (command, tab) => {
    if (command === 'open-work-link' && tab?.url) {
      await configManager.loadConfig();
      const domainConfig = configManager.findDomainByUrl(tab.url);
      
      if (domainConfig?.workLink) {
        // 在新标签页中打开工作链接
        await browser.tabs.create({ url: domainConfig.workLink });
      } else {
        // 如果没有配置工作链接，显示通知
        if (tab.id) {
          await browser.tabs.sendMessage(tab.id, {
            type: 'SHOW_NOTIFICATION',
            message: '当前域名未配置工作链接，请先在插件设置中配置。'
          });
        }
      }
    }
  });

  // 安装时的初始化
  browser.runtime.onInstalled.addListener(() => {
    console.log('Workify Chrome Extension installed');
  });
});