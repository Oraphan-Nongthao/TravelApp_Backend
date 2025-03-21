import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App"; // Type ของ Stack Navigator
import { Color, FontFamily, FontSize, Border } from "../GlobalStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import DropDownPicker from "react-native-dropdown-picker";
import { BASE_URL } from "../config";

const ProfileSettings = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // State สำหรับจัดเก็บข้อมูลโปรไฟล์
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [birthday, setBirthday] = useState("");

  const [day, setDay] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);

  // สำหรับ DropDownPicker
  const [genderOpen, setGenderOpen] = useState(false);
  const [dayOpen, setDayOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);

  const genderOptions = [
    { label: "ชาย", value: "male" },
    { label: "หญิง", value: "female" },
    { label: "อื่นๆ", value: "other" },
    { label: "ไม่ระบุ", value: "none" },
  ];

  const days = Array.from({ length: 31 }, (_, i) => ({
    label: `${i + 1}`,
    value: i + 1,
  }));
  const months = Array.from({ length: 12 }, (_, i) => ({
    label: `${i + 1}`,
    value: i + 1,
  }));
  const years = Array.from({ length: 100 }, (_, i) => ({
    label: `${new Date().getFullYear() - i}`,
    value: new Date().getFullYear() - i,
  }));

  // ✅ โหลดข้อมูลโปรไฟล์จาก API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          navigation.replace("Auth");
          return;
        }

        const response = await axios.get(`${BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const profile = response.data;
        setName(profile.account_name || "");
        setEmail(profile.account_email || "");
        setPhone(profile.account_telephone || "");
        setGender(profile.account_gender || "none");

        if (profile.account_birthday) {
          const [yearStr, monthStr, dayStr] = profile.account_birthday.split("-");
          setDay(parseInt(dayStr, 10));
          setMonth(parseInt(monthStr, 10));
          setYear(parseInt(yearStr, 10));
        }
      } catch (error) {
        Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // ✅ บันทึกข้อมูลที่อัปเดต
  const handleSave = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("เกิดข้อผิดพลาด", "กรุณาเข้าสู่ระบบใหม่");
        return;
      }

      const formattedBirthday =
        year && month && day ? `${year}-${month}-${day}` : "";

      await axios.put(
        `${BASE_URL}/profile/update`,
        {
          account_name: name,
          account_telephone: phone,
          account_gender: gender,
          account_birthday: formattedBirthday,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert("สำเร็จ", "บันทึกข้อมูลเรียบร้อย");
      navigation.goBack();
    } catch (error) {
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View >
        <ActivityIndicator size="large" color={Color.colorCornflowerblue} />
        <Text>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  return (''
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.colorWhite,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 40,
    backgroundColor: Color.colorCornflowerblue,
  },
  backText: {
    fontSize: FontSize.size_base,
    color: Color.colorWhite,
  },
  headerTitle: {
    fontSize: FontSize.size_xl,
    fontFamily: FontFamily.nunitoBold,
    color: Color.colorWhite,
  },
  content: {
    alignItems: "center",
    paddingVertical: 20,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 5,
  },
  changeAvatarText: {
    fontSize: FontSize.size_mini,
    color: Color.colorCornflowerblue,
    fontFamily: FontFamily.nunitoBold,
  },
  inputContainer: {
    width: "90%",
  },
  label: {
    fontSize: FontSize.size_base,
    fontFamily: FontFamily.nunitoBold,
    color: Color.colorBlack,
    marginBottom: 5,
  },
  input: {
    height: 40,
    backgroundColor: Color.colorWhitesmoke_200,
    borderRadius: Border.br_3xs,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: Color.colorCornflowerblue,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: Border.br_81xl,
  },
  saveButtonText: {
    fontSize: FontSize.size_base,
    fontFamily: FontFamily.nunitoBold,
    color: Color.colorWhite,
  },
});

export default ProfileSettings;
