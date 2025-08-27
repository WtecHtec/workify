import React, { useState } from 'react';
import { useConfig } from '../hooks/useConfig';
import { useCurrentTab } from '../hooks/useCurrentTab';
import './App.css';

function App() {
  const { config, addDomain, updateDomain, findDomainByUrl } = useConfig();
  const { currentUrl, reloadCurrentTab } = useCurrentTab();
  const [titleInput, setTitleInput] = useState('');
  const [workLinkInput, setWorkLinkInput] = useState('');

  const handleAddCurrentDomain = async () => {
    if (currentUrl) {
      try {
        const url = new URL(currentUrl);
        const domain = url.hostname;
        
        const existingDomain = findDomainByUrl(currentUrl);
        if (!existingDomain) {
          await addDomain(domain);
          alert('域名配置已添加！');
        } else {
          alert('该域名配置已存在！');
        }
      } catch (error) {
        alert('无效的URL');
      }
    }
  };

  const handleApplyTitle = async () => {
    if (titleInput.trim() && currentUrl) {
      try {
        let domainConfig = findDomainByUrl(currentUrl);
        if (!domainConfig) {
          const url = new URL(currentUrl);
          domainConfig = await addDomain(url.hostname);
        }
        
        await updateDomain(domainConfig.id, {
          titleConfig: { enabled: true, newTitle: titleInput.trim() }
        });
        
        await reloadCurrentTab();
        alert('标题配置已应用！');
        setTitleInput('');
      } catch (error) {
        alert('应用标题失败');
      }
    }
  };

  const handleApplyWorkLink = async () => {
    if (workLinkInput.trim() && currentUrl) {
      try {
        let domainConfig = findDomainByUrl(currentUrl);
        if (!domainConfig) {
          const url = new URL(currentUrl);
          domainConfig = await addDomain(url.hostname);
        }
        
        await updateDomain(domainConfig.id, { workLink: workLinkInput.trim() });
        alert('工作链接已设置！');
        setWorkLinkInput('');
      } catch (error) {
        alert('设置工作链接失败');
      }
    }
  };

  const openOptionsPage = async () => {
     // 获取当前活动标签页
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      // 打开侧边面板
      await browser.sidePanel.open({ tabId: tab.id });
      // 关闭当前popup
      window.close();
    }
  };

  return (
    <div className="workify-popup">
      <div className="header">
        <h2>Workify 配置</h2>
        <button onClick={openOptionsPage} className="btn-secondary">
          打开设置
        </button>
      </div>
      
      <div className="current-page">
        <h3>当前页面</h3>
        <div className="current-url">
          {currentUrl || '加载中...'}
        </div>
        <button onClick={handleAddCurrentDomain} className="btn-primary">
          添加当前域名配置
        </button>
      </div>
      
      <div className="quick-config">
        <h3>快速配置</h3>
        
        <div className="form-group">
          <label>页面标题:</label>
          <div className="input-group">
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="输入新标题"
            />
            <button onClick={handleApplyTitle} className="btn-primary">
              应用
            </button>
          </div>
        </div>
        
        <div className="form-group">
          <label>工作链接:</label>
          <div className="input-group">
            <input
              type="url"
              value={workLinkInput}
              onChange={(e) => setWorkLinkInput(e.target.value)}
              placeholder="输入工作链接"
            />
            <button onClick={handleApplyWorkLink} className="btn-primary">
              应用
            </button>
          </div>
        </div>
      </div>
      
      <div className="shortcut-info">
        <p className="shortcut-text">
          快捷键: <strong>Ctrl+Shift+W</strong> (Mac: Cmd+Shift+W)
        </p>
      </div>
    </div>
  );
}

export default App;