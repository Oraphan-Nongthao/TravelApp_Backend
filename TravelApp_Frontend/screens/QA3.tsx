import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
} from "react-native";
import axios from "axios";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../App"; 
import { Color, FontFamily, FontSize, Border } from "../GlobalStyles";
import Header from "../component/Header";
import Progress from "../component/Progress";
import Bank from "../assets/Bank.svg";
import { BASE_URL } from "../config";

const QA3 = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, "QA3">>();
  const route = useRoute<RouteProp<RootStackParamList, "QA3">>();
  const { selectedOption, selectedPlan } = route.params; // ✅ รับค่าจาก QA1 และ QA2

  const [distances, setDistances] = useState<
    { distance_id: number; distance_km: string }[]
  >([]);
  const [selectedDistance, setSelectedDistance] = useState<string | null>(null);
  const [butget, setButget] = useState<string>("");

  useEffect(() => {
    axios
      .get(`${BASE_URL}/qa_distance`)
      .then((response) => {
        setDistances(response.data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView />
      <Header page="3" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Progress progress="75" />
        <Text style={styles.title}>ระยะทางในการเดินทาง</Text>

        <View style={styles.optionGrid}>
          {distances.map((distance) => (
            <TouchableOpacity
              key={distance.distance_id}
              style={[
                styles.option,
                selectedDistance === distance.distance_km && styles.optionSelected,
              ]}
              onPress={() => setSelectedDistance(distance.distance_km)}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedDistance === distance.distance_km && styles.optionTextSelected,
                ]}
              >
                {distance.distance_km}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* งบประมาณ */}
        <Text style={styles.title}>งบประมาณในการเดินทาง</Text>
        <View style={styles.inputContainer}>
          <TextInput
            onChangeText={(text) => {
              const numericValue = text.replace(/[^0-9]/g, ""); // ✅ ลบอักขระที่ไม่ใช่ตัวเลข
              setButget(numericValue);
            }}
            value={butget} // ✅ แสดงค่าใน input
            keyboardType="numeric"
            style={styles.input}
            placeholder="กรอกงบประมาณ"
          />
          <Bank width={20} height={20} />
        </View>
      </ScrollView>

      {/* ปุ่มกลับ */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>กลับ</Text>
      </TouchableOpacity>

      {/* ปุ่มต่อไป */}
      <TouchableOpacity
        style={[styles.nextButton, !(selectedDistance && butget) && styles.buttonDisabled]}
        onPress={() => {
          if (selectedDistance && butget) {
            navigation.navigate("QA4", { 
              selectedOption,  // ✅ ส่งค่าที่เลือกจาก QA1
              selectedPlan,    // ✅ ส่งค่าที่เลือกจาก QA2
              selectedDistance, // ✅ ส่งค่าที่เลือกจาก QA3
              butget           // ✅ ส่งค่าที่เลือกจาก QA3
            });
          }
        }}
        disabled={!(selectedDistance && butget)}
      >
        <Text style={styles.buttonText}>ต่อไป</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.colorWhite,
  },
  scrollContainer: {
    paddingBottom: 100, // ป้องกันปุ่มถูกบัง
  },
  title: {
    fontSize: 20,
    fontFamily: FontFamily.nunitoBold,
    color: Color.colorBlack,
    marginBottom: 10,
    textAlign: "center",
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 10,
  },
  option: {
    width: "45%",
    marginHorizontal: 5,
    marginVertical: 10,
    backgroundColor: Color.colorWhitesmoke_100,
    paddingVertical: 12,
    borderRadius: Border.br_base,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionSelected: {
    borderColor: Color.colorCornflowerblue,
    backgroundColor: Color.colorCornflowerblue,
  },
  optionText: {
    fontSize: FontSize.size_mini,
    fontFamily: FontFamily.nunitoBold,
    color: Color.colorBlack,
  },
  optionTextSelected: {
    color: Color.colorWhite,
  },
  inputContainer: {
    flexDirection: "row",
    width: "60%",
    height: 40,
    backgroundColor: Color.colorWhitesmoke_100,
    alignItems: "center",
    borderRadius: Border.br_3xs,
    alignSelf: "center",
    marginTop: 20,
    paddingHorizontal: 10,
  },
  input: {
    width: "85%",
    textAlign: "center",
    fontSize: FontSize.size_mini,
  },
  nextButton: {
    backgroundColor: Color.colorCornflowerblue,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: Border.br_base,
    alignItems: "center",
    position: "absolute",
    bottom: 40,
    right: 20,
  },
  backButton: {
    backgroundColor: Color.colorDimgray,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: Border.br_base,
    alignItems: "center",
    position: "absolute",
    bottom: 40,
    left: 20,
  },
  buttonDisabled: {
    backgroundColor: Color.colorGray_100,
  },
  buttonText: {
    fontSize: FontSize.m3LabelMedium_size,
    fontFamily: FontFamily.nunitoBold,
    fontWeight: "700",
    color: Color.colorWhite,
  },
});

export default QA3;
