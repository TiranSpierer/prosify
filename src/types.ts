export interface ProsifyConfig {
  name: string;
  description: string;
  url?: string;
  basePath?: string;
  logo?: string;
  navigation?: NavGroup[];
  theme?: ThemeConfig;
  footer?: string;
  llms?: LlmsConfig;
  analytics?: AnalyticsConfig;
}

export interface NavGroup {
  group: string;
  pages: string[];
}

export interface ThemeConfig {
  primary?: string;
  accentLight?: string;
  accentDark?: string;
  dark?: boolean;
}

export interface AnalyticsConfig {
  script: string;
  attrs?: Record<string, string>;
}

export interface LlmsConfig {
  full?: boolean;
  exclude?: string[];
}

export interface PageFrontmatter {
  title?: string;
  description?: string;
  order?: number;
}

export interface Page {
  slug: string;
  filePath: string;
  frontmatter: PageFrontmatter;
  title: string;
  description: string;
  rawContent: string;
  htmlContent: string;
  headings: Heading[];
  readingTime: number;
  lastUpdated?: Date;
}

export interface Heading {
  id: string;
  text: string;
  level: number;
}

export interface BuildOptions {
  docsDir: string;
  outDir: string;
  configPath?: string;
  baseUrl?: string;
  basePath?: string;
}

export interface SearchEntry {
  id: string;
  title: string;
  description: string;
  body: string;
  slug: string;
}
