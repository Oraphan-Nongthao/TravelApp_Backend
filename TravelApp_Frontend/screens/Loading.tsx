import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Image,
} from "react-native";
import axios from "axios";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../App"; 
import { Color, FontFamily, FontSize } from "../GlobalStyles";
import { BASE_URL } from "../config";

const Loading = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, "Loading">>();
  const route = useRoute<RouteProp<RootStackParamList, "Loading">>();
  const {
    selectedOption,
    selectedPlan,
    selectedDistance,
    butget,
    selectedActivities,
    latitude,
    longitude
  } = route.params;

  const [places, setPlaces] = useState<any[]>([]); // เก็บข้อมูลจาก API
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
  
    // ✅ เช็คว่ามีพิกัดหรือไม่
    const useLatLon = latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null;
  
    const apiURL = useLatLon 
      ? `${BASE_URL}/search_nearby?latitude=${latitude}&longitude=${longitude}&radius=200`
      : `${BASE_URL}/search_nearby?postcode=12120&radius=200m`;
  
    axios
      .get(apiURL)
      .then((response) => {
        setPlaces(response.data.data); // ✅ เก็บข้อมูลสถานที่
        setIsLoading(false);
  
        // ✅ ไปหน้า Result พร้อมส่งข้อมูล
        navigation.replace("Result", {
          selectedOption,
          selectedPlan,
          selectedDistance,
          butget,
          selectedActivities,
          places: response.data.data, // ✅ ส่งข้อมูลสถานที่ไป Result
        });
      })
      .catch((error) => {
        console.error("❌ Error fetching data:", error);
        setIsLoading(false);
      });
  }, [navigation, latitude, longitude]);
  

  return (
    <View style={styles.container}>
      <Image source={require("../assets/loading.gif")} style={styles.gif} />
      {/* ข้อความ */}
      <Text style={styles.title}>ขอให้สนุกกับการเดินทาง</Text>
      <Text style={styles.subtitle}>
        {`รอสักครู่ในการค้นหาสถานที่ที่เหมาะกับคุณโดย\n
        AI จะทำการค้นหาสถานที่ที่เหมาะสมกับคุณ\n
        ขอให้คุณเพลิดเพลินเเละสนุกกับทริปในครั้งนี้`}
      </Text>

      {/* แถบโหลด */}
      {isLoading && (
        <ActivityIndicator size="large" color={Color.colorCornflowerblue} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.colorWhite,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: FontSize.size_xl,
    fontFamily: FontFamily.nunitoBold,
    color: Color.colorBlack,
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: FontSize.m3LabelMedium_size,
    fontFamily: FontFamily.nunitoRegular,
    color: "#858585",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  gif: {
    width: 200,
    height: 200,
    marginBottom: 10,
  },
});

export default Loading;
