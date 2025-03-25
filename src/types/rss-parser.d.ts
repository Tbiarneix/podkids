declare module 'rss-parser' {
  export interface CustomFeedItem {
    title?: string;
    link?: string;
    pubDate?: string;
    creator?: string;
    content?: string;
    contentSnippet?: string;
    guid?: string;
    isoDate?: string;
    categories?: string[];
    enclosure?: {
      url?: string;
      length?: string;
      type?: string;
    };
    'itunes:image'?: {
      href?: string;
    };
    'itunes:duration'?: string;
    'itunes:explicit'?: string;
    'itunes:subtitle'?: string;
    'itunes:summary'?: string;
    'itunes:keywords'?: string;
    'itunes:episodeType'?: string;
    'itunes:episode'?: string;
    'itunes:season'?: string;
  }

  export interface CustomFeed {
    title?: string;
    description?: string;
    link?: string;
    language?: string;
    copyright?: string;
    lastBuildDate?: string;
    creator?: string;
    items: CustomFeedItem[];
    feedUrl?: string;
    image?: {
      link?: string;
      url?: string;
      title?: string;
    };
    'itunes:owner'?: {
      name?: string;
      email?: string;
    };
    'itunes:author'?: string;
    'itunes:image'?: {
      href?: string;
    };
    'itunes:explicit'?: string;
    'itunes:category'?: Array<{
      text?: string;
      'itunes:category'?: Array<{
        text?: string;
      }>;
    }>;
  }

  export interface ParserOptions {
    customFields?: {
      feed?: string[];
      item?: string[];
    };
    headers?: Record<string, string>;
    timeout?: number;
    maxRedirects?: number;
    requestOptions?: Record<string, any>;
  }

  class Parser<T extends CustomFeed = CustomFeed, U extends CustomFeedItem = CustomFeedItem> {
    constructor(options?: ParserOptions);
    parseURL(url: string, options?: ParserOptions): Promise<T>;
    parseString(xml: string, options?: ParserOptions): Promise<T>;
  }

  export default Parser;
}
