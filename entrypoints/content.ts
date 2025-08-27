import { ConfigManager } from './utils/ConfigManager';
import type { DomainConfig, ElementConfig } from './types/config';

// 扩展HTMLElement类型以支持自定义属性
declare global {
  interface HTMLElement {
    _workifyMouseEnter?: () => void;
    _workifyMouseLeave?: () => void;
  }
}

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    const configManager = ConfigManager.getInstance();
    let currentDomainConfig: DomainConfig | undefined;
    let titleObserver: MutationObserver | null = null;
    let elementObserver: MutationObserver | null = null;
    let retryCount = 0;
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 1000; // 1秒

    // 等待页面完全加载
    async function waitForPageLoad(): Promise<void> {
      return new Promise((resolve) => {
        if (document.readyState === 'complete') {
          resolve();
        } else {
          window.addEventListener('load', () => resolve());
        }
      });
    }

    // 等待特定时间
    function delay(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 初始化
    async function init() {
      try {
        await configManager.loadConfig();
        currentDomainConfig = configManager.findDomainByUrl(window.location.href);
        
        if (currentDomainConfig) {
          console.log('找到匹配的域名配置:', currentDomainConfig.domain);
          
          // 等待页面完全加载
          await waitForPageLoad();
          
          // 额外等待一段时间，确保页面脚本执行完毕
          await delay(500);
          
          // 应用配置
          await applyConfigWithRetry();
          
          // 设置监听器防止后续修改
          setupTitleProtection();
          setupElementProtection();
        } else {
          console.log('未找到匹配的域名配置');
        }
      } catch (error) {
        console.error('初始化失败:', error);
      }
    }

    // 带重试的配置应用
    async function applyConfigWithRetry() {
      if (!currentDomainConfig) return;
      
      for (let i = 0; i < MAX_RETRIES; i++) {
        applyTitleConfig(currentDomainConfig);
        applyElementConfigs(currentDomainConfig.elementConfigs);
        
        // 等待一段时间后检查是否被覆盖
        await delay(RETRY_DELAY);
        
        // 检查标题是否被覆盖
        if (currentDomainConfig.titleConfig?.enabled && 
            currentDomainConfig.titleConfig.newTitle &&
            document.title !== currentDomainConfig.titleConfig.newTitle) {
          console.log(`标题被覆盖，第${i + 1}次重试`);
          retryCount++;
          continue;
        }
        
        // 如果没有被覆盖，退出重试循环
        console.log('配置应用成功');
        break;
      }
      
      if (retryCount >= MAX_RETRIES) {
        console.warn('达到最大重试次数，可能存在持续的标题覆盖');
      }
    }

    // 设置标题保护
    function setupTitleProtection() {
      if (!currentDomainConfig?.titleConfig?.enabled || !currentDomainConfig.titleConfig.newTitle) {
        return;
      }

      const targetTitle = currentDomainConfig.titleConfig.newTitle;
      
      // 监听标题变化
      titleObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.target === document.head) {
            // 检查是否有新的title元素被添加
            const titleElement = document.querySelector('title');
            if (titleElement && titleElement.textContent !== targetTitle) {
              console.log('检测到标题被修改，重新应用配置');
              titleElement.textContent = targetTitle;
            }
          }
        });
      });

      // 监听head元素的变化
      titleObserver.observe(document.head, {
        childList: true,
        subtree: true
      });

      // 也监听title元素本身的变化
      const titleElement = document.querySelector('title');
      if (titleElement) {
        const titleTextObserver = new MutationObserver(() => {
          if (document.title !== targetTitle) {
            console.log('检测到标题文本被修改，重新应用配置');
            document.title = targetTitle;
          }
        });
        
        titleTextObserver.observe(titleElement, {
          childList: true,
          characterData: true,
          subtree: true
        });
      }
    }

    // 设置元素保护
    function setupElementProtection() {
      if (!currentDomainConfig?.elementConfigs?.length) return;

      // 使用防抖来避免频繁执行
      let debounceTimer: number | null = null;
      
      elementObserver = new MutationObserver(() => {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        
        debounceTimer = window.setTimeout(() => {
          console.log('检测到DOM变化，重新应用元素配置');
          applyElementConfigs(currentDomainConfig!.elementConfigs);
        }, 300);
      });

      // 监听整个文档的变化
      elementObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }

    // 修改页面标题
    function applyTitleConfig(domainConfig: DomainConfig) {
      if (domainConfig.titleConfig?.enabled && domainConfig.titleConfig.newTitle) {
        const oldTitle = document.title;
        document.title = domainConfig.titleConfig.newTitle;
        console.log(`标题已修改: "${oldTitle}" -> "${domainConfig.titleConfig.newTitle}"`);
      }
    }

    // 处理元素显示配置
    function applyElementConfigs(elementConfigs: ElementConfig[]) {
      if (!elementConfigs || elementConfigs.length === 0) return;
      
      elementConfigs.forEach(config => {
        try {
          const elements = getElementByXPath(config.xpath);
          if (elements.length === 0) {
            console.log(`未找到匹配的元素: ${config.xpath}`);
          } else {
            console.log(`找到 ${elements.length} 个匹配元素: ${config.xpath}`);
            elements.forEach(element => {
              applyElementConfig(element as HTMLElement, config);
            });
          }
        } catch (error) {
          console.error(`处理元素配置时出错: ${config.xpath}`, error);
        }
      });
    }

    // 应用单个元素配置
    function applyElementConfig(element: HTMLElement, config: ElementConfig) {
      if (!element) return;
      
      try {
        switch (config.displayType) {
          case 'hide':
            element.style.display = 'none';
            // 添加标记以便后续识别
            element.setAttribute('data-workify-hidden', 'true');
            console.log('隐藏元素:', config.xpath);
            break;
            
          case 'show':
            element.style.display = '';
            element.removeAttribute('data-workify-hidden');
            if (config.displayText) {
              element.textContent = config.displayText;
            }
            console.log('显示元素:', config.xpath);
            break;
            
          case 'hover':
            const originalDisplay = element.style.display;
            element.style.display = 'none';
            element.setAttribute('data-workify-hover', 'true');
            
            // 移除之前的事件监听器（如果存在）
            if (element._workifyMouseEnter) {
              element.removeEventListener('mouseenter', element._workifyMouseEnter);
            }
            if (element._workifyMouseLeave) {
              element.removeEventListener('mouseleave', element._workifyMouseLeave);
            }
            
            // 添加新的事件监听器
            element._workifyMouseEnter = () => {
              element.style.display = originalDisplay || '';
              if (config.displayText) {
                element.textContent = config.displayText;
              }
            };
            
            element._workifyMouseLeave = () => {
              element.style.display = 'none';
            };
            
            element.addEventListener('mouseenter', element._workifyMouseEnter);
            element.addEventListener('mouseleave', element._workifyMouseLeave);
            console.log('设置悬停显示:', config.xpath);
            break;
            
          default:
            console.warn('未知的显示类型:', config.displayType);
        }
      } catch (error) {
        console.error('应用元素配置时出错:', error);
      }
    }

    // 通过XPath获取元素
    function getElementByXPath(xpath: string): Node[] {
      try {
        const result = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null
        );
        
        const elements: Node[] = [];
        for (let i = 0; i < result.snapshotLength; i++) {
          const node = result.snapshotItem(i);
          if (node) elements.push(node);
        }
        return elements;
      } catch (error) {
        console.error('XPath查询出错:', xpath, error);
        return [];
      }
    }

    // 显示通知
    function showNotification(message: string) {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #333;
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        max-width: 300px;
        word-wrap: break-word;
      `;
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      // 3秒后自动移除
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 3000);
    }

    // 清理函数
    function cleanup() {
      if (titleObserver) {
        titleObserver.disconnect();
        titleObserver = null;
      }
      if (elementObserver) {
        elementObserver.disconnect();
        elementObserver = null;
      }
      console.log('清理完成');
    }

    // 监听页面卸载，清理资源
    window.addEventListener('beforeunload', cleanup);

    // 监听来自background的消息
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      try {
        if (message.type === 'GET_CURRENT_URL') {
          sendResponse({ url: window.location.href });
        } else if (message.type === 'RELOAD_CONFIG') {
          console.log('收到重新加载配置的消息');
          cleanup();
          init();
        } else if (message.type === 'SHOW_NOTIFICATION') {
          showNotification(message.message);
        }
      } catch (error) {
        console.error('处理消息时出错:', error);
      }
    });

    // 启动初始化
    init();
  }
});