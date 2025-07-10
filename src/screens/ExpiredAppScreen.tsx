import React, { useState } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  Image,
  Text,
} from "react-native";
import { Typography } from "../components/Typography";
import { Button } from "../components/Button";
import { COLORS, SPACING } from "../utils/theme";
import { EmailService } from "../services/EmailService";
import { useToast } from "../contexts/ToastContext";
import { Linking } from "react-native";

export const ExpiredAppScreen: React.FC = () => {
  const { showToast } = useToast();
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  const [feedbackSubject, setFeedbackSubject] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const handleOpenFeedbackModal = () => {
    setFeedbackSubject("");
    setFeedbackMessage("");
    setIsFeedbackModalVisible(true);
  };

  const handleCloseFeedbackModal = () => {
    setIsFeedbackModalVisible(false);
  };

  const handleSendFeedback = async () => {
    // Vérifier que les champs ne sont pas vides
    if (!feedbackSubject.trim()) {
      showToast("Veuillez entrer un sujet", "error");
      return;
    }

    if (!feedbackMessage.trim()) {
      showToast("Veuillez entrer un message", "error");
      return;
    }

    try {
      // Envoyer l'email via le service (ouvre l'application de messagerie)
      await EmailService.sendFeedbackEmail({
        subject: feedbackSubject,
        message: feedbackMessage,
      });

      // Fermer la modale et afficher un message
      handleCloseFeedbackModal();
      showToast("Application de messagerie ouverte", "success");
    } catch (error) {
      console.error(
        "Erreur lors de l'ouverture de l'application de messagerie:",
        error
      );
      showToast(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'ouverture de l'application de messagerie",
        "error"
      );
    }
  };

  const handleOpenWebsite = () => {
    Linking.openURL("https://podkids.app");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Modale de feedback */}
      <Modal
        visible={isFeedbackModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseFeedbackModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Typography variant="title" style={styles.modalTitle}>
              Faire un retour
            </Typography>

            <Typography variant="body" style={styles.inputLabel}>
              Sujet
            </Typography>
            <TextInput
              style={styles.inputShort}
              value={feedbackSubject}
              onChangeText={setFeedbackSubject}
              placeholder="Entrez le sujet"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
            />

            <Typography variant="body" style={styles.inputLabel}>
              Message
            </Typography>
            <TextInput
              style={styles.inputLong}
              value={feedbackMessage}
              onChangeText={setFeedbackMessage}
              placeholder="Entrez votre message"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              multiline={true}
              numberOfLines={10}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <Button
                title="Annuler"
                variant="outline"
                onPress={handleCloseFeedbackModal}
                style={styles.modalButton}
              />
              <Button
                title="Envoyer"
                variant="primary"
                onPress={handleSendFeedback}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>podKids</Text>
        </View>
        <Typography variant="title" center style={styles.title}>
          Période de test terminée
        </Typography>

        <Typography variant="body" style={styles.message}>
          La période de test de l'application est terminée, merci beaucoup pour
          votre participation. Vous pouvez suivre l'actualité de l'application
          sur notre site ou nous faire vos derniers retours avant la mise en
          ligne de la première version officielle !
        </Typography>

        <View style={styles.buttonsContainer}>
          <Button
            title="Visiter le site web"
            variant="outline"
            onPress={handleOpenWebsite}
            fullWidth
            style={styles.button}
          />
          <Button
            title="Faire un retour"
            variant="primary"
            onPress={handleOpenFeedbackModal}
            fullWidth
            style={styles.button}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  logo: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: SPACING.md,
    fontFamily: "Rubik_700Bold",
  },
  title: {
    marginBottom: SPACING.xl,
  },
  message: {
    marginBottom: SPACING.xxl,
    lineHeight: 24,
  },
  buttonsContainer: {
    marginTop: SPACING.xl,
  },
  button: {
    marginBottom: SPACING.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    padding: SPACING.lg,
    width: "90%",
    maxWidth: 500,
  },
  modalTitle: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    marginBottom: SPACING.xs,
  },
  inputShort: {
    backgroundColor: COLORS.background,
    borderRadius: 4,
    padding: SPACING.md,
    color: COLORS.text,
    marginBottom: SPACING.md,
    fontFamily: "Rubik_400Regular",
  },
  inputLong: {
    backgroundColor: COLORS.background,
    borderRadius: 4,
    padding: SPACING.md,
    color: COLORS.text,
    marginBottom: SPACING.lg,
    minHeight: 150,
    fontFamily: "Rubik_400Regular",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
});
