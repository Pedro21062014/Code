
declare module 'livecodes' {
  export interface LiveCodes {
    format(): Promise<void>;
    getShareUrl(shortUrl?: boolean): Promise<string>;
    getConfig(): Promise<any>;
    setConfig(config: any): Promise<any>;
    getCode(): Promise<any>;
    show(panel: any, options?: any): Promise<void>;
    run(): Promise<void>;
    destroy(): Promise<void>;
    onChange(fn: (content: string) => void): { remove: () => void };
  }

  export interface EmbedOptions {
    appUrl?: string;
    params?: {
      loading?: 'eager' | 'lazy' | 'click';
      view?: 'editor' | 'result' | 'split';
      mode?: 'full' | 'result' | 'editor' | 'codeblock';
      [key: string]: any;
    };
    config?: any;
    import?: string;
    lite?: boolean;
    loading?: 'eager' | 'lazy' | 'click';
    template?: string;
    view?: 'editor' | 'result' | 'split';
    mode?: 'full' | 'result' | 'editor' | 'codeblock';
  }

  export function createPlayground(
    container: string | HTMLElement,
    options?: EmbedOptions
  ): Promise<LiveCodes>;
}
