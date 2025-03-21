import * as React from "react";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { ImageBackground, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Color, Border, FontFamily, FontSize } from "../GlobalStyles";
import { useNavigation } from "@react-navigation/native";

const Auth = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ImageBackground
      source={require("../assets/glaciallakesgokyovillagenepaladapt-11901-1.png")}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Overlay */}
      <View style={styles.overlay} />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.appTitle}>Travel App</Text>
      </View>
      <View style={styles.sectionPosition}>
      <Text style={styles.subtitle}>
          <Text style={styles.letThe}>Let the{"\n"}</Text>
          <Text style={styles.feelingTakeYou}>Feeling take you{"\n"}</Text>
          <Text style={styles.travel}>Travel</Text>
        </Text>
  
      <View style={styles.buttonContainer}>
          {/* ปุ่ม Sign Up */}
          <TouchableOpacity
            style={styles.signUpWrapper}
            onPress={() => navigation.navigate("SignUp")} // ไปหน้าสมัครสมาชิก (SignUp)
          >
            <Text style={styles.signUpText}>ลงทะเบียน</Text>
          </TouchableOpacity>

          {/* ปุ่ม Sign In */}
          <TouchableOpacity
            style={styles.signInWrapper}
            onPress={() => navigation.navigate("SignIn")} // ไปหน้าล็อกอิน (SignIn)
          >
            <Text style={styles.signInText}>เข้าสู่ระบบ</Text>
          </TouchableOpacity>
        </View>
        </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1, // ทำให้ background เต็มจอ
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)", // เพิ่มความเข้มให้พื้นหลัง
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start", // ดันเนื้อหาขึ้นด้านบน
    paddingHorizontal: 20,
    position: "absolute",
    top: '30%'
},
  appTitle: {
    fontSize: 64,
    fontFamily: FontFamily.oleoScriptSwashCapsRegular,
    color: Color.colorWhite,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    textAlign: "center"
  },
  subtitle: {
    fontSize: 24,
    color: Color.colorWhite,
    textAlign: "center",
    marginVertical: 20,
  },
  letThe: {
    fontSize: 24,
    fontFamily: FontFamily.montserratRegular,
    textAlign:'right'
  },
  feelingTakeYou: {
    fontSize: 36,
    fontFamily: FontFamily.montserratMedium,
    fontWeight: "500",
    textAlign:'right'
  },
  travel: {
    fontSize: 40,
    fontFamily: FontFamily.montserratRegular,
    textAlign:'right'
  },
  profileContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  userProfile: {
    position: "absolute",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  signUpWrapper: {
    flex: 1,
    height: 38,
    backgroundColor: Color.colorCornflowerblue,
    borderRadius: Border.br_base,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  signInWrapper: {
    flex: 1,
    height: 38,
    backgroundColor: Color.colorCornflowerblue,
    borderRadius: Border.br_base,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 30,
  },
  signUpText: {
    fontSize: FontSize.size_xl,
    fontFamily: FontFamily.nunitoBold,
    fontWeight: "700",
    color: Color.colorWhite,
    textAlign: "center",
  },
  signInText: {
    fontSize: FontSize.size_xl,
    fontFamily: FontFamily.nunitoBold,
    fontWeight: "700",
    color: Color.colorWhite,
    textAlign: "center",
  },
  sectionPosition: {
     position: 'absolute',
    bottom:'12%',
    paddingHorizontal:40
  }
});

export default Auth;
