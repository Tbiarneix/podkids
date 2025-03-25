declare module 'react-native-rss-parser' {
  export interface FeedItem {
    id: string;
    title: string;
    links: Array<{ url: string; rel: string }>;
    description: string;
    content: string;
    published: string;
    created: string;
    categories: Array<{ name: string }>;
    authors: Array<{ name: string }>;
    enclosures: Array<{ url: string; length: string; mimeType: string }>;
    itunes?: {
      authors: string[];
      block: string;
      image: string;
      duration: string;
      explicit: string;
      subtitle: string;
      summary: string;
      keywords: string[];
      episodeType: string;
      episode: string;
      season: string;
    };
  }

  // Alias pour FeedItem pour correspondre à l'utilisation dans le code
  export type Item = FeedItem;

  export interface Feed {
    title: string;
    links: Array<{ url: string; rel: string }>;
    description: string;
    language: string;
    copyright: string;
    authors: Array<{ name: string }>;
    lastUpdated: string;
    lastPublished: string;
    categories: Array<{ name: string }>;
    image?: {
      url: string;
      title: string;
      description: string;
      width: string;
      height: string;
    };
    itunes?: {
      authors: string[];
      block: string;
      categories: Array<{ name: string; subCategories: Array<{ name: string }> }>;
      image: string;
      explicit: string;
      complete: string;
      owner: {
        name: string;
        email: string;
      };
      subtitle: string;
      summary: string;
      keywords: string[];
    };
    items: FeedItem[];
  }

  export function parse(text: string): Promise<Feed>;
}
