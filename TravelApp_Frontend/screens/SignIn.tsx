import React, { useState } from "react";
import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage"; // ✅ ใช้ AsyncStorage เก็บ Token
import axios from "axios"; // ✅ ใช้ axios เรียก API
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { useNavigation } from "@react-navigation/native";
import User from "../assets/user.svg";
import Password2 from "../assets/password-2.svg";
import EyeOn from "../assets/eye_on.svg";
import EyeOff from "../assets/eye-off.svg";
import { Color, FontFamily, FontSize, Border } from "../GlobalStyles";
import { BASE_URL } from "../config";

const SignIn = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // ✅ เก็บค่าที่ผู้ใช้กรอก
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState<Boolean>(false);

  // 🔹 ฟังก์ชันเข้าสู่ระบบ
  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
  
    try {
      const response = await axios.post(`${BASE_URL}/signin`, {
        account_email: email,
        account_password: password,
      });
  
      if (response.status === 200) {
        const token = response.data.token;
  
        // ✅ บันทึก Token ลงใน AsyncStorage
        await AsyncStorage.setItem("userToken", token);
        await AsyncStorage.setItem("userEmail", email);
        
        if (Platform.OS === "web") {
          window.location.href = "/"; // ✅ ใช้ window.location บน Web
        }else{
          Alert.alert("เข้าสู่ระบบสำเร็จ!", "กำลังนำทางไปหน้า HomePage", [
            { text: "ตกลง", onPress: () => navigation.replace("HomePage") }, 
          ]);
        }
      }
    } catch (error) {
      Alert.alert("เข้าสู่ระบบล้มเหลว", "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      console.error("Signin Error:", error);
    }
  };
  

  return (
    <ImageBackground
      source={require("../assets/glaciallakesgokyovillagenepaladapt-11901-2.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View>
        <Text style={styles.title}>Sign In</Text>

        <View style={styles.container}>
          {/* Input Email */}
          <View style={styles.inputContainer}>
            <User width={24} height={24} style={styles.icon} />
            <TextInput
              placeholder="อีเมล์"
              placeholderTextColor={Color.colorGray_100}
              style={styles.input}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Input Password */}
          <View style={styles.inputContainer}>
            <Password2 width={24} height={24} style={styles.icon} />
            <TextInput
              placeholder="รหัสผ่าน"
              placeholderTextColor={Color.colorGray_100}
              style={styles.input}
              secureTextEntry={!show}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShow(!show)}>
              {show ? (
                <EyeOn width={24} height={24} style={styles.icon} />
              ) : (
                <EyeOff width={24} height={24} style={styles.icon} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ปุ่ม Sign In */}
        <TouchableOpacity style={styles.buttonContainer} onPress={handleSignIn}>
          <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>
        </TouchableOpacity>

        {/* ปุ่ม Back */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("Auth")}
        >
          <Text style={styles.buttonText}>กลับ</Text>
        </TouchableOpacity>
      </View>

      
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  container: {
    width: "85%",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 35,
    borderRadius: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    color: Color.colorWhite,
    marginBottom: 20,
    fontWeight: "bold",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginVertical: 10,
    width: "100%",
    backgroundColor: Color.colorGainsboro_100,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#00000038",
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.montserratRegular,
    color: Color.colorGray_100,
    paddingVertical: 12,
    fontWeight: "700",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 40,
    backgroundColor: Color.colorCornflowerblue,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 32,
    alignSelf: "center",
  },
  backButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 40,
    backgroundColor: Color.colorGray_100,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 32,
    alignSelf: "center",
  },
  buttonText: {
    fontSize: FontSize.size_xl,
    fontFamily: FontFamily.nunitoBold,
    fontWeight: "700",
    color: Color.colorWhite,
  },
});

export default SignIn;
