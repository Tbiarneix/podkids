import React from "react";
import { View, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { Typography } from "../components/Typography";
import { Button } from "../components/Button";
import { COLORS, SPACING } from "../utils/theme";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";

type PresentationScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Presentation"
>;

export const PresentationScreen: React.FC = () => {
  const navigation = useNavigation<PresentationScreenNavigationProp>();

  const handleUnderstand = () => {
    navigation.navigate("PinCode");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Typography variant="title" center>
            Présentation
          </Typography>

          <Typography variant="body" style={styles.paragraph}>
            Podkids est une application de gestion de podcasts pour les enfants.
            Vous pouvez actuellement gérer un profil, ajouter des podcasts à
            votre bibliothèque et les écouter. Cette application est pensée pour
            éviter aux enfants d'être exposés à des contenus inapropriés.
          </Typography>

          <Typography variant="body" style={styles.paragraph}>
            N'hésitez pas à nous faire vos retours ! Ils seront primordiaux pour
            les améliorations à venir.
          </Typography>

          <Typography variant="body" style={styles.paragraph}>
            PodKids est un projet indépendant développé par une équipe réduite.
            L'application est actuellement en version Beta et accessible
            gratuitement. Nous ne pouvons pas garantir qu'elle restera gratuite
            lors de sa mise en production finale, mais en tant que beta-testeurs
            vous aurez ensuite un accès privilégié à la version finale. Nous ne
            pouvons pas non plus garantir la pérénité de vos données dans
            l'application. Nous ne collectons AUCUNES de vos données.
          </Typography>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="J'ai compris" onPress={handleUnderstand} fullWidth />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: SPACING.xxxl,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
  },
  paragraph: {
    marginBottom: SPACING.lg,
    marginTop: SPACING.md,
  },
  footer: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xl * 1.5,
  },
});
