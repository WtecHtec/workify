export interface DomainConfig {
  id: string;
  domain: string;
  titleConfig?: TitleConfig;
  elementConfigs: ElementConfig[];
  workLink?: string;
}

export interface TitleConfig {
  enabled: boolean;
  newTitle: string;
}

export interface ElementConfig {
  id: string;
  xpath: string;
  displayType: 'show' | 'hide' | 'hover';
  displayText?: string;
}

export interface GlobalConfig {
  domains: DomainConfig[];
}