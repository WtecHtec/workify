import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: '正在认真工作(Workify)',
    description: '网页工作效率提升工具',
    version: '0.0.1',
    permissions: [
      'storage',
      'activeTab',
      'tabs',
      'sidePanel'
    ],
    host_permissions: [
      '<all_urls>'
    ],
    action: {
      default_title: '正在认真工作(Workify)'
    },
    side_panel: {
      default_path: 'options.html'
    },
    options_page: 'options.html',
    commands: {
      "open-work-link": {
        "suggested_key": {
          "default": "Ctrl+Shift+W",
          "mac": "Command+Shift+W"
        },
        "description": "打开工作链接"
      }
    }
  }
});