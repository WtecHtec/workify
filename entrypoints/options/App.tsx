import React, { useState } from 'react';
import { useConfig } from '../hooks/useConfig';
import type { DomainConfig, ElementConfig } from '../types/config';
import './style.css';

function App() {
  const { config, loading, addDomain, updateDomain, deleteDomain } = useConfig();
  const [newDomainInput, setNewDomainInput] = useState('');

  const handleAddDomain = async () => {
    if (newDomainInput.trim()) {
      await addDomain(newDomainInput.trim());
      setNewDomainInput('');
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (confirm('确定要删除这个域名配置吗？')) {
      await deleteDomain(domainId);
    }
  };

  const openShortcutsPage = () => {
    browser.tabs.create({ url: 'chrome://extensions/shortcuts' });
  };

  if (loading) {
    return (
      <div className="loading">
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="workify-options">
      <main>
        <section className="shortcut-info">
          <h2>快捷键说明</h2>
          <p>快捷键已在插件中预设为 <strong>Ctrl+Shift+W</strong>（Mac: Command+Shift+W）</p>
          <p>您可以在 Chrome 扩展管理页面中自定义快捷键</p>
          <button onClick={openShortcutsPage} className="btn-primary">
            打开快捷键设置
          </button>
        </section>
        
        <section className="domain-settings">
          <h2>域名配置</h2>
          
          <div className="add-domain">
            <div className="input-group">
              <input
                type="text"
                value={newDomainInput}
                onChange={(e) => setNewDomainInput(e.target.value)}
                placeholder="输入域名（支持正则表达式）"
                onKeyPress={(e) => e.key === 'Enter' && handleAddDomain()}
              />
              <button onClick={handleAddDomain} className="btn-primary">
                添加域名
              </button>
            </div>
          </div>
          
          <div className="domain-list">
            {config.domains.length === 0 ? (
              <p className="empty-state">暂无域名配置</p>
            ) : (
              config.domains.map(domain => (
                <DomainConfigCard
                  key={domain.id}
                  domain={domain}
                  onUpdate={(updates) => updateDomain(domain.id, updates)}
                  onDelete={() => handleDeleteDomain(domain.id)}
                />
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

interface DomainConfigCardProps {
  domain: DomainConfig;
  onUpdate: (updates: Partial<DomainConfig>) => void;
  onDelete: () => void;
}

function DomainConfigCard({ domain, onUpdate, onDelete }: DomainConfigCardProps) {
  const [titleEnabled, setTitleEnabled] = useState(domain.titleConfig?.enabled || false);
  const [titleText, setTitleText] = useState(domain.titleConfig?.newTitle || '');
  const [workLink, setWorkLink] = useState(domain.workLink || '');
  const [elements, setElements] = useState<ElementConfig[]>(domain.elementConfigs || []);

    // 添加 useEffect 来同步 domain prop 的变化
  useEffect(() => {
    setTitleEnabled(domain.titleConfig?.enabled || false);
    setTitleText(domain.titleConfig?.newTitle || '');
    setWorkLink(domain.workLink || '');
    setElements(domain.elementConfigs || []);
  }, [domain]);
  
  const handleSave = async () => {
    // 调用父组件的 onUpdate 函数来保存配置
    await onUpdate({
      titleConfig: { enabled: titleEnabled, newTitle: titleText },
      workLink: workLink || undefined,
      elementConfigs: elements
    });
    alert('域名配置已保存！');
  };

  const addElement = () => {
    const newElement: ElementConfig = {
      id: Date.now().toString(),
      xpath: '',
      displayType: 'show'
    };
    setElements([...elements, newElement]);
  };

  const updateElement = (elementId: string, updates: Partial<ElementConfig>) => {
    setElements(elements.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    ));
  };

  const deleteElement = (elementId: string) => {
    setElements(elements.filter(el => el.id !== elementId));
  };

  return (
    <div className="domain-card">
      <div className="domain-header">
        <h3>{domain.domain}</h3>
        <button onClick={onDelete} className="btn-danger">
          删除
        </button>
      </div>
      
      <div className="domain-config">
        <div className="config-section">
          <h4>标题配置</h4>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={titleEnabled}
              onChange={(e) => setTitleEnabled(e.target.checked)}
            />
            启用标题修改
          </label>
          <input
            type="text"
            value={titleText}
            onChange={(e) => setTitleText(e.target.value)}
            placeholder="新标题"
            disabled={!titleEnabled}
          />
        </div>
        
        <div className="config-section">
          <h4>工作链接</h4>
          <input
            type="url"
            value={workLink}
            onChange={(e) => setWorkLink(e.target.value)}
            placeholder="工作链接"
          />
        </div>
        
        <div className="config-section">
          <h4>元素配置</h4>
          <button onClick={addElement} className="btn-secondary">
            添加元素
          </button>
          
          <div className="element-list">
            {elements.map(element => (
              <ElementConfigItem
                key={element.id}
                element={element}
                onUpdate={(updates) => updateElement(element.id, updates)}
                onDelete={() => deleteElement(element.id)}
              />
            ))}
          </div>
        </div>
      </div>
      
      <button onClick={handleSave} className="btn-primary save-btn">
        保存域名配置
      </button>
    </div>
  );
}

interface ElementConfigItemProps {
  element: ElementConfig;
  onUpdate: (updates: Partial<ElementConfig>) => void;
  onDelete: () => void;
}

function ElementConfigItem({ element, onUpdate, onDelete }: ElementConfigItemProps) {
  return (
    <div className="element-item">
      <div className="element-fields">
        <input
          type="text"
          value={element.xpath}
          onChange={(e) => onUpdate({ xpath: e.target.value })}
          placeholder="XPath"
        />
        <select
          value={element.displayType}
          onChange={(e) => onUpdate({ displayType: e.target.value as 'show' | 'hide' | 'hover' })}
        >
          <option value="show">显示</option>
          <option value="hide">隐藏</option>
          <option value="hover">鼠标悬停显示</option>
        </select>
        <input
          type="text"
          value={element.displayText || ''}
          onChange={(e) => onUpdate({ displayText: e.target.value })}
          placeholder="显示文案"
        />
        <button onClick={onDelete} className="btn-danger">
          删除
        </button>
      </div>
    </div>
  );
}

export default App;