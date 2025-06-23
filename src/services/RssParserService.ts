/**
 * Service de parsing RSS simple et compatible avec React Native
 * Utilise des expressions régulières pour extraire les données des flux RSS
 */

export interface RssFeedItem {
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
  content?: string;
  contentEncoded?: string;
  guid?: string;
  enclosureUrl?: string;
  enclosureLength?: string;
  enclosureType?: string;
  itunesImage?: string;
  itunesDuration?: string;
  itunesExplicit?: string;
  itunesSubtitle?: string;
  itunesSummary?: string;
}

export interface RssFeed {
  title?: string;
  description?: string;
  link?: string;
  language?: string;
  copyright?: string;
  lastBuildDate?: string;
  items: RssFeedItem[];
  imageUrl?: string;
  imageTitle?: string;
  imageLink?: string;
  itunesOwnerName?: string;
  itunesOwnerEmail?: string;
  itunesAuthor?: string;
  itunesImage?: string;
}

export class RssParserService {
  /**
   * Récupère et parse un flux RSS
   * @param url URL du flux RSS
   * @returns Le flux RSS parsé
   */
  static async parseRssFeed(url: string): Promise<RssFeed> {
    try {
      // Ajouter https:// si l'URL n'a pas de protocole
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      // Récupérer le contenu du flux
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Convertir la réponse en texte
      const responseText = await response.text();
      
      if (responseText.length === 0) {
        throw new Error('Le flux RSS est vide');
      }
      
      // Parser le texte en flux RSS
      return this.parseRssText(responseText);
    } catch (error) {
      console.error('Erreur lors de la récupération du flux RSS:', error);
      throw error;
    }
  }

  /**
   * Parse le texte XML d'un flux RSS
   * @param xmlText Texte XML du flux RSS
   * @returns Le flux RSS parsé
   */
  private static parseRssText(xmlText: string): RssFeed {
    // Nettoyer le texte XML
    xmlText = xmlText.replace(/<!--[\s\S]*?-->/g, ''); // Supprimer les commentaires
    
    // Extraire les informations du channel
    const channelMatch = /<channel>([\s\S]*?)<\/channel>/i.exec(xmlText);
    if (!channelMatch) {
      throw new Error('Format RSS invalide: balise <channel> non trouvée');
    }
    
    const channelContent = channelMatch[1];
    
    // Créer l'objet feed
    const feed: RssFeed = {
      title: this.extractTagContent(channelContent, 'title'),
      description: this.extractTagContent(channelContent, 'description'),
      link: this.extractTagContent(channelContent, 'link'),
      language: this.extractTagContent(channelContent, 'language'),
      copyright: this.extractTagContent(channelContent, 'copyright'),
      lastBuildDate: this.extractTagContent(channelContent, 'lastBuildDate'),
      itunesAuthor: this.extractTagContent(channelContent, 'itunes:author'),
      itunesImage: this.extractTagAttribute(channelContent, 'itunes:image', 'href'),
      items: []
    };
    
    // Extraire les informations de l'image
    const imageMatch = /<image>([\s\S]*?)<\/image>/i.exec(channelContent);
    if (imageMatch) {
      const imageContent = imageMatch[1];
      feed.imageUrl = this.extractTagContent(imageContent, 'url');
      feed.imageTitle = this.extractTagContent(imageContent, 'title');
      feed.imageLink = this.extractTagContent(imageContent, 'link');
    }
    
    // Extraire les informations du propriétaire iTunes
    const itunesOwnerMatch = /<itunes:owner>([\s\S]*?)<\/itunes:owner>/i.exec(channelContent);
    if (itunesOwnerMatch) {
      const ownerContent = itunesOwnerMatch[1];
      feed.itunesOwnerName = this.extractTagContent(ownerContent, 'itunes:name');
      feed.itunesOwnerEmail = this.extractTagContent(ownerContent, 'itunes:email');
    }
    
    // Extraire les items
    const itemMatches = this.extractAllTags(channelContent, 'item');
    feed.items = itemMatches.map(itemContent => this.parseItem(itemContent));
    
    return feed;
  }
  
  /**
   * Parse un item du flux RSS
   * @param itemContent Contenu XML de l'item
   * @returns L'item parsé
   */
  private static parseItem(itemContent: string): RssFeedItem {
    const item: RssFeedItem = {
      title: this.extractTagContent(itemContent, 'title'),
      link: this.extractTagContent(itemContent, 'link'),
      pubDate: this.extractTagContent(itemContent, 'pubDate'),
      description: this.extractTagContent(itemContent, 'description'),
      content: this.extractTagContent(itemContent, 'content'),
      contentEncoded: this.extractTagContent(itemContent, 'content:encoded'),
      guid: this.extractTagContent(itemContent, 'guid'),
      itunesImage: this.extractTagAttribute(itemContent, 'itunes:image', 'href'),
      itunesDuration: this.extractTagContent(itemContent, 'itunes:duration'),
      itunesExplicit: this.extractTagContent(itemContent, 'itunes:explicit'),
      itunesSubtitle: this.extractTagContent(itemContent, 'itunes:subtitle'),
      itunesSummary: this.extractTagContent(itemContent, 'itunes:summary')
    };
    
    // Extraire les informations de l'enclosure
    const enclosureMatch = /<enclosure[^>]*>/i.exec(itemContent);
    if (enclosureMatch) {
      const enclosureTag = enclosureMatch[0];
      item.enclosureUrl = this.extractAttribute(enclosureTag, 'url');
      item.enclosureLength = this.extractAttribute(enclosureTag, 'length');
      item.enclosureType = this.extractAttribute(enclosureTag, 'type');
    }
    
    return item;
  }
  
  /**
   * Extrait le contenu d'une balise XML
   * @param xmlContent Contenu XML
   * @param tagName Nom de la balise
   * @returns Le contenu de la balise ou undefined si non trouvé
   */
  private static extractTagContent(xmlContent: string, tagName: string): string | undefined {
    // Cas spécial pour itunes:duration qui peut avoir différents formats dans les flux RSS
    if (tagName === 'itunes:duration') {
      // Essayer d'abord avec la balise standard
      const standardRegex = new RegExp(`<${tagName}[^>]*>(.*?)<\/${tagName}>`, 'is');
      const standardMatch = standardRegex.exec(xmlContent);
      
      if (standardMatch && standardMatch[1]) {
        console.log(`Durée trouvée (format standard): ${standardMatch[1].trim()}`);
        return this.decodeXmlEntities(standardMatch[1].trim());
      }
      
      // Essayer avec une balise auto-fermante
      const selfClosingRegex = new RegExp(`<${tagName}[^>]*\/>`, 'i');
      const selfClosingMatch = selfClosingRegex.exec(xmlContent);
      
      if (selfClosingMatch) {
        const durationAttr = this.extractAttribute(selfClosingMatch[0], 'value');
        if (durationAttr) {
          console.log(`Durée trouvée (attribut value): ${durationAttr}`);
          return durationAttr;
        }
      }
      
      // Essayer avec une balise sans namespace (juste "duration")
      const noNamespaceRegex = new RegExp(`<duration[^>]*>(.*?)<\/duration>`, 'is');
      const noNamespaceMatch = noNamespaceRegex.exec(xmlContent);
      
      if (noNamespaceMatch && noNamespaceMatch[1]) {
        console.log(`Durée trouvée (sans namespace): ${noNamespaceMatch[1].trim()}`);
        return this.decodeXmlEntities(noNamespaceMatch[1].trim());
      }
      
      console.log('Aucune durée trouvée dans:', xmlContent.substring(0, 200) + '...');
      return undefined;
    }
    
    // Pour les autres balises, utiliser l'extraction standard
    const regex = new RegExp(`<${tagName}[^>]*>(.*?)<\/${tagName}>`, 'is');
    const match = regex.exec(xmlContent);
    if (match && match[1]) {
      // Extraire le contenu et traiter les sections CDATA
      let content = match[1].trim();
      content = this.extractCdataContent(content);
      
      // Décoder les entités XML
      const decodedContent = this.decodeXmlEntities(content);
      
      // Nettoyer les balises HTML pour les champs textuels
      if (['description', 'content', 'contentEncoded', 'itunesSummary', 'itunesSubtitle', 'title'].includes(tagName)) {
        return this.stripHtmlTags(decodedContent);
      }
      return decodedContent;
    }
    return undefined;
  }
  
  /**
   * Extrait un attribut d'une balise XML
   * @param xmlContent Contenu XML
   * @param tagName Nom de la balise
   * @param attributeName Nom de l'attribut
   * @returns La valeur de l'attribut ou undefined si non trouvé
   */
  private static extractTagAttribute(xmlContent: string, tagName: string, attributeName: string): string | undefined {
    const tagRegex = new RegExp(`<${tagName}[^>]*>`, 'i');
    const tagMatch = tagRegex.exec(xmlContent);
    if (tagMatch) {
      return this.extractAttribute(tagMatch[0], attributeName);
    }
    return undefined;
  }
  
  /**
   * Extrait un attribut d'une balise XML
   * @param tag Balise XML
   * @param attributeName Nom de l'attribut
   * @returns La valeur de l'attribut ou undefined si non trouvé
   */
  private static extractAttribute(tag: string, attributeName: string): string | undefined {
    const regex = new RegExp(`${attributeName}=["']([^"']*)["']`, 'i');
    const match = regex.exec(tag);
    if (match && match[1]) {
      return this.decodeXmlEntities(match[1].trim());
    }
    return undefined;
  }
  
  /**
   * Extrait toutes les occurrences d'une balise XML
   * @param xmlContent Contenu XML
   * @param tagName Nom de la balise
   * @returns Tableau des contenus des balises
   */
  private static extractAllTags(xmlContent: string, tagName: string): string[] {
    const results: string[] = [];
    const regex = new RegExp(`<${tagName}[^>]*>(.*?)<\/${tagName}>`, 'gis');
    let match;
    
    while ((match = regex.exec(xmlContent)) !== null) {
      if (match[1]) {
        results.push(match[1].trim());
      }
    }
    
    return results;
  }
  
  /**
   * Décode les entités XML
   * @param text Texte à décoder
   * @returns Texte décodé
   */
  private static decodeXmlEntities(text: string): string {
    if (!text) return text;
    
    // Entités XML standard
    let decoded = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
    
    // Entités HTML courantes
    decoded = decoded
      .replace(/&nbsp;/g, ' ')
      .replace(/&ensp;/g, ' ')
      .replace(/&emsp;/g, ' ')
      .replace(/&ndash;/g, '-')
      .replace(/&mdash;/g, '—')
      .replace(/&lsquo;/g, "'")
      .replace(/&rsquo;/g, "'")
      .replace(/&sbquo;/g, ',')
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .replace(/&bdquo;/g, '"')
      .replace(/&laquo;/g, '<<')
      .replace(/&raquo;/g, '>>')
      .replace(/&bull;/g, '*')
      .replace(/&hellip;/g, '...')
      .replace(/&copy;/g, '(c)')
      .replace(/&reg;/g, '(r)')
      .replace(/&trade;/g, '(tm)')
      .replace(/&euro;/g, 'EUR')
      .replace(/&pound;/g, 'GBP')
      .replace(/&yen;/g, 'JPY')
      .replace(/&cent;/g, 'c');
    
    // Entités numériques
    decoded = decoded
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    
    return decoded;
  }
  
  /**
   * Nettoie les balises HTML d'un texte
   * @param text Texte contenant potentiellement des balises HTML
   * @returns Texte nettoyé sans balises HTML
   */
  private static stripHtmlTags(text: string): string {
    if (!text) return text;
    
    // Extraire le contenu des sections CDATA si présentes
    text = this.extractCdataContent(text);
    
    // Remplacer les balises <br>, <p>, <div> par des sauts de ligne
    let cleanedText = text
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>\s*<div[^>]*>/gi, '\n')
      .replace(/<div[^>]*>/gi, '')
      .replace(/<\/div>/gi, '\n');
    
    // Supprimer toutes les autres balises HTML
    cleanedText = cleanedText.replace(/<[^>]*>/g, '');
    
    // Supprimer les espaces multiples et les sauts de ligne multiples
    cleanedText = cleanedText
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
    
    return cleanedText;
  }
  
  /**
   * Extrait le contenu des sections CDATA
   * @param text Texte pouvant contenir des sections CDATA
   * @returns Texte avec les sections CDATA extraites
   */
  private static extractCdataContent(text: string): string {
    if (!text) return text;
    
    // Extraire le contenu des sections CDATA
    return text.replace(/<!\[CDATA\[(.*?)\]\]>/gs, (_, cdataContent) => cdataContent);
  }
}
