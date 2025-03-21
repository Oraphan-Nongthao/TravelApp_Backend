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
import axios from "axios"; // ✅ นำเข้า axios สำหรับเรียก API
import User from "../assets/user.svg";
import Password2 from "../assets/password-2.svg";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { Color, FontFamily, FontSize, Border } from "../GlobalStyles";
import { BASE_URL } from "../config";

const SignUp = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // ✅ เก็บค่าที่ผู้ใช้กรอก
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      const message = "กรุณากรอกข้อมูลให้ครบถ้วน";
      Platform.OS === "web" ? window.alert(message) : Alert.alert(message);
      return;
    }

    if (password !== confirmPassword) {
      const message = "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน";
      Platform.OS === "web" ? window.alert(message) : Alert.alert(message);
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL}/signup`, {
        account_email: email,
        account_password: password,
        confirm_password: confirmPassword,
      });

      if (response.status === 201) {
        const message = "สมัครสมาชิกสำเร็จ! คุณสามารถเข้าสู่ระบบได้แล้ว";
        Platform.OS === "web" ? window.alert(message) : Alert.alert(message, "", [
          { text: "ตกลง", onPress: () => navigation.navigate("SignIn") },
        ]);
      }
    } catch (error) {
      console.error("Signup Error:", error);
      const message = "เกิดข้อผิดพลาด ไม่สามารถสมัครสมาชิกได้";
      Platform.OS === "web" ? window.alert(message) : Alert.alert(message);
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
        <Text style={styles.title}>ลงทะเบียน</Text>

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
              secureTextEntry={true}
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* Input Confirm Password */}
          <View style={styles.inputContainer}>
            <Password2 width={24} height={24} style={styles.icon} />
            <TextInput
              placeholder="ยืนยันรหัสผ่าน"
              placeholderTextColor={Color.colorGray_100}
              style={styles.input}
              secureTextEntry={true}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>
        </View>

        {/* ปุ่ม Sign Up */}
        <TouchableOpacity style={styles.buttonContainer} onPress={handleSignUp}>
          <Text style={styles.buttonText}>ลงทะเบียน</Text>
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
    fontFamily: FontFamily.montserratBold,
    color: Color.colorWhite,
    marginBottom: 20,
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

export default SignUp;
