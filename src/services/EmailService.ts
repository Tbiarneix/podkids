import { Linking } from 'react-native';

export interface FeedbackData {
  subject: string;
  message: string;
}

export class EmailService {
  // Adresse email de destination pour les feedbacks
  private static readonly FEEDBACK_EMAIL = 'podkids.app@gmail.com';

  /**
   * Initialise le service d'email (pas nécessaire pour cette implémentation)
   */
  static init() {
    // Pas d'initialisation nécessaire pour cette implémentation
  }

  /**
   * Ouvre l'application de messagerie par défaut avec un email pré-rempli
   * @param data Les données du feedback (sujet et message)
   * @returns Une promesse qui se résout lorsque l'application de messagerie est ouverte
   */
  static async sendFeedbackEmail(data: FeedbackData): Promise<boolean> {
    try {
      // Encoder les paramètres pour l'URL
      const subject = encodeURIComponent(data.subject);
      const body = encodeURIComponent(data.message);
      
      // Créer l'URL mailto
      const mailtoUrl = `mailto:${this.FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
      
      // Vérifier si l'URL peut être ouverte
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      
      if (!canOpen) {
        throw new Error('Aucune application de messagerie n\'est disponible sur cet appareil.');
      }
      
      // Ouvrir l'application de messagerie
      await Linking.openURL(mailtoUrl);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de l\'application de messagerie:', error);
      throw error;
    }
  }
}
