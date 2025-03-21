import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Linking,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../App"; 
import { Color, FontFamily, FontSize, Border } from "../GlobalStyles";
import MapIcon from "../assets/map.svg";

const Result = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, "Result">>();
  const route = useRoute<RouteProp<RootStackParamList, "Result">>();
  const { places } = route.params; // ✅ รับข้อมูลสถานที่จาก Loading

  // 🔹 ฟังก์ชันเปิด Google Maps
  const openGoogleMaps = (lat?: number, lon?: number, name?: string) => {
    if (lat && lon) {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`);
    } else if (name) {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`);
    } else {
      alert("ไม่พบข้อมูลพิกัดของสถานที่นี้");
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView />
      <View style={styles.header}>
        <Text style={styles.title}>สถานที่ที่เหมาะกับอารมณ์คุณตอนนี้</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>
            ผลลัพธ์ คุณเหมาะที่จะไปสถานที่นี้ เพราะ...
          </Text>
        </View>

        {/* 🔹 แสดงผลข้อมูลจาก API */}
        {places.map((place, index) => (
          <View key={index} style={styles.card}>
            <Image 
              source={{ uri: "https://placehold.co/400x300" }} 
              style={styles.image} 
            />

            <View style={styles.infoContainer}>
              <Text style={styles.placeName}>{place.name}</Text>
              <View style={styles.details}>
                <MapIcon width={14} height={14} />
                <Text style={styles.description}>{place.address}</Text>
              </View>

              {/* ปุ่มค้นหาเส้นทาง */}
              <TouchableOpacity 
                style={styles.routeButton} 
                onPress={() => openGoogleMaps(place.lat, place.lon, place.name)}
              >
                <Text style={styles.routeText}>ค้นหาเส้นทาง</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* ปุ่มกลับหน้าแรก */}
        <TouchableOpacity
            onPress={async () => {
              const token = await AsyncStorage.getItem("userToken"); // ✅ ดึง Token ของผู้ใช้
              if (token) {
                navigation.navigate("HomePage"); // ✅ ถ้าเข้าสู่ระบบแล้ว ไปหน้า HomePage
              } else {
                navigation.navigate("Auth"); // ❌ ถ้ายังไม่ได้เข้าสู่ระบบ ไปหน้า Auth
              }
            }}
            style={[styles.routeButton, styles.back]}
          >
          <Text style={styles.routeText}>กลับหน้าแรก</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.colorWhite,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop:40,
    borderBottomWidth: 1,
    borderBottomColor: Color.colorWhitesmoke_100,
  },
  title: {
    fontSize: FontSize.size_base,
    fontFamily: FontFamily.nunitoBold,
    textAlign: "center",
  },
  scrollView: {
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  resultBox: {
    width: "100%",
    padding: 20,
    backgroundColor: Color.colorWhitesmoke_100,
    borderRadius: Border.br_xl,
    minHeight: 108,
    marginBottom: 40,
  },
  resultText: {
    color: "#828282",
    fontSize: FontSize.size_mini,
    textAlign: "center",
  },
  card: {
    backgroundColor: Color.colorWhitesmoke_200,
    borderRadius: Border.br_base,
    marginBottom: 20,
    overflow: "hidden",
  },
  image: {
    width: Dimensions.get("screen").width,
    height: 200,
  },
  infoContainer: {
    padding: 15,
    flex: 1,
    gap: 5,
  },
  placeName: {
    fontSize: FontSize.size_mini,
    fontFamily: FontFamily.nunitoBold,
    color: Color.colorBlack,
  },
  description: {
    fontSize: FontSize.size_mini,
    fontFamily: FontFamily.nunitoRegular,
  },
  details: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  routeButton: {
    backgroundColor: Color.colorCornflowerblue,
    paddingVertical: 10,
    borderRadius: Border.br_base,
    alignItems: "center",
    width: "40%",
    alignSelf: "center",
    marginTop: 10,
  },
  routeText: {
    fontSize: FontSize.size_mini,
    fontFamily: FontFamily.nunitoBold,
    color: Color.colorWhite,
  },
  back: {
    width: "25%",
    backgroundColor: "#B7B7B7",
    marginBottom: 40,
  },
});

export default Result;
