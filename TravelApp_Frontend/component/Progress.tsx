import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Border, Color } from "../GlobalStyles";
interface Props {
  progress: string;
}
const Progress: React.FC<Props> = ({ progress }) => {
  const safeProgress = Math.min(Math.max(parseFloat(progress), 0), 100);
  return (
    <View style={styles.container}>
      <View style={[styles.progress, { width: `${safeProgress}%` }]} />
    </View>
  );
};

export default Progress;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 7,
    backgroundColor: Color.colorWhitesmoke_100,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,

    elevation: 4,
    borderRadius: Border.br_3xs,
    marginBottom: 40,
  },
  progress: {
    width: "0%",
    height: 7,
    backgroundColor: Color.colorBlack,
    borderRadius: Border.br_3xs,
  },
});
