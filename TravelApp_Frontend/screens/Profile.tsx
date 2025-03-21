import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  PermissionsAndroid, 
  Platform,
  Alert
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import {jwtDecode} from "jwt-decode";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { Color, FontFamily, FontSize, Border } from "../GlobalStyles";
import DropDownPicker from "react-native-dropdown-picker";
import * as Location from 'expo-location';
import { BASE_URL } from "../config";
import LongdoMapView from "./LongdoMapView";
import * as ImagePicker from 'expo-image-picker';

type DecodedToken = {
  account_id: number;
  account_email: string;
};

type ProfileData = {
  account_id: number;
  account_email: string;
  account_name: string;
  account_gender: string;
  account_birthday: string;
  account_picture: string;
  account_telephone: string;
  latitude: number;
  longitude: number;
};

const Profile = () => {
  const [open, setOpen] = React.useState<boolean>(false);
  const [value, setValue] = React.useState(null);
  const [phone, setPhone] = React.useState("");
  const [edit, setEdit] = React.useState<boolean>(false);

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, "");

    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (!match) return text;

    const part1 = match[1];
    const part2 = match[2] ? `-${match[2]}` : "";
    const part3 = match[3] ? `-${match[3]}` : "";

    return `${part1}${part2}${part3}`;
  };

  const handleChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhone(formatted);
  };
  const [genderList, setGenderList] = React.useState([
    { label: "ชาย", value: "male" },
    { label: "หญิง", value: "female" },
    { label: "อื่นๆ", value: "other" },
    { label: "ไม่ระบุ", value: "none" },
  ]);
  const [genderOpen, setGenderOpen] = useState(false);
  const [gender, setGender] = useState<string | null>(null);
  const [name, setName] = React.useState<string | null>(null);
  const [day, setDay] = React.useState<number | null>(null);
  const [month, setMonth] = React.useState<number | null>(null);
  const [year, setYear] = React.useState<number | null>(null);
  const [latitude, setLatitude] = React.useState<number | null>(null);
  const [longitude, setLongitude] = React.useState<number | null>(null);
  const [account_picture, setAccountPicture] = React.useState<string | null>(null);

  const [dayOpen, setDayOpen] = React.useState(false);
  const [monthOpen, setMonthOpen] = React.useState(false);
  const [yearOpen, setYearOpen] = React.useState(false);

  const days = Array.from({ length: 31 }, (_, i) => ({
    label: `${i + 1}`,
    value: i + 1,
  }));
  const months = [
    { label: "1", value: 1 },
    { label: "2", value: 2 },
    { label: "3", value: 3 },
    { label: "4", value: 4 },
    { label: "5", value: 5 },
    { label: "6", value: 6 },
    { label: "7", value: 7 },
    { label: "8", value: 8 },
    { label: "9", value: 9 },
    { label: "10", value: 10 },
    { label: "11", value: 11 },
    { label: "12", value: 12 },
  ];
  const years = Array.from({ length: 100 }, (_, i) => ({
    label: `${new Date().getFullYear() - i}`,
    value: new Date().getFullYear() - i,
  }));
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ โหลดข้อมูลโปรไฟล์จาก API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          console.warn("❌ No Token Found. Redirecting to Auth.");
          navigation.replace("Auth");
          return;
        }
  
        const decoded: DecodedToken = jwtDecode(token);
        console.log("📩 JWT Payload:", decoded);
  
        const response = await axios.get(
          `${BASE_URL}/accounts_list/${decoded.account_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
  
        console.log("📩 response:", response.data);
        setProfile(response.data); // ✅ อัปเดตโปรไฟล์
      } catch (err) {
        setError("ไม่สามารถโหลดข้อมูลได้");
        console.error("❌ Profile Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchProfile();
  }, []); // ✅ useEffect สำหรับ fetch ข้อมูลโปรไฟล์
  
  // ✅ useEffect สำหรับแยกวัน/เดือน/ปี
  useEffect(() => {
    if (profile?.account_birthday && profile.account_birthday !== "0000-00-00") {
      const [yearStr, monthStr, dayStr] = profile.account_birthday.split("-");
      setYear(yearStr ? parseInt(yearStr, 10) : null);
      setMonth(monthStr ? parseInt(monthStr, 10) : null);
      setDay(dayStr ? parseInt(dayStr, 10) : null);
    } else {
      setYear(null);
      setMonth(null);
      setDay(null);
    }

    if (profile) {
    console.log(profile.longitude);
    setName(profile.account_name || "");
      setGender(profile.account_gender || "none");
      setPhone(profile.account_telephone || "");
      setLatitude(profile.latitude ? profile.latitude: null);
      setLongitude(profile.longitude ? profile.longitude : null);
      setAccountPicture(profile.account_picture || "");
    }
  }, [profile]); // ✅ ทำงานเมื่อ profile เปลี่ยนแปลง
  
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const fineLocation = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "ขออนุญาตใช้พิกัด",
            message: "แอปต้องการเข้าถึงตำแหน่งของคุณ",
            buttonNeutral: "ถามอีกครั้ง",
            buttonNegative: "ยกเลิก",
            buttonPositive: "ตกลง"
          }
        );
  
        if (fineLocation !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log("❌ ปฏิเสธการขอใช้ตำแหน่ง");
          return false;
        }
  
        // ขอ Background Location (สำหรับ Android 11+)
        if (Platform.Version >= 30) {
          const backgroundLocation = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
            {
              title: "ขออนุญาตใช้พิกัดเบื้องหลัง",
              message: "แอปต้องใช้ตำแหน่งในพื้นหลังเพื่อการทำงาน",
              buttonNeutral: "ถามอีกครั้ง",
              buttonNegative: "ยกเลิก",
              buttonPositive: "ตกลง"
            }
          );
  
          if (backgroundLocation !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log("❌ ปฏิเสธการขอใช้ตำแหน่งพื้นหลัง");
            return false;
          }
        }
  
        console.log("✅ ได้รับอนุญาตให้ใช้ตำแหน่ง");
        return true;
      } catch (err) {
        console.warn("❌ Error ขออนุญาต:", err);
        return false;
      }
    }
    return true;
  };
  

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('❌ Permission denied');
      return;
    }
  
    console.log("📡 กำลังดึงพิกัด...");
  
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
  
    console.log("📌 ได้รับพิกัด:", location.coords.latitude, location.coords.longitude);
    setLatitude(location.coords.latitude);
    setLongitude(location.coords.longitude);
    updateLocation(location.coords.latitude, location.coords.longitude);
  };
  
  const updateLocation = async (latitude: number, longitude: number) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        console.warn("❌ No Token Found. Redirecting to Auth.");
        navigation.replace("Auth");
        return;
      }
  
      if (!profile) return;
  
      const response = await axios.post(
        `${BASE_URL}/profile_location/${profile.account_id}`,
        { latitude, longitude },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      console.log("📡 อัปเดตพิกัดสำเร็จ:", response.data);
      Alert.alert("ตำแหน่ง", "อัปเดตตำแหน่งสำเร็จ");
    } catch (error) {
      console.error("❌ อัปเดตพิกัดผิดพลาด:", error);
    }
  };  

  const updateProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        console.warn("❌ No Token Found. Redirecting to Auth.");
        navigation.replace("Auth");
        return;
      }
  
      if (!profile) return;
  
      // ✅ จัดรูปแบบวันเกิดให้เป็น YYYY-MM-DD
      const formattedBirthday =
  year && month && day
    ? `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`
    : "0000-00-00"; // ✅ ถ้าไม่มีค่าจะส่งค่าเริ่มต้น


  
      const payload = {
        account_email: profile.account_email, // ไม่แก้ไขอีเมล
        account_name: name ?? profile.account_name,
        account_gender: gender ?? profile.account_gender,
        account_birthday: formattedBirthday,
        account_picture: account_picture ?? profile.account_picture,
        account_telephone: phone ?? profile.account_telephone,
        latitude: latitude ?? profile.latitude,
        longitude: longitude ?? profile.longitude,
      };
  
      console.log("📩 ส่งข้อมูลไป API:", payload);
  
      const response = await axios.put(
        `${BASE_URL}/profile/${profile.account_id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      console.log("✅ อัปเดตโปรไฟล์สำเร็จ:", response.data);
      setEdit(false); // ✅ ปิดโหมดแก้ไข
    } catch (error) {
      console.error("❌ อัปเดตโปรไฟล์ผิดพลาด:", error);
    }
  };

  const signout = async () => {
    try {
      await AsyncStorage.removeItem("userToken"); // ✅ ลบ Token
      await AsyncStorage.removeItem("userEmail"); // ✅ ลบข้อมูลอีเมล
      console.log("✅ ออกจากระบบสำเร็จ");
      
      navigation.replace("SignIn"); // ✅ นำไปยังหน้าเข้าสู่ระบบ
    } catch (error) {
      console.error("❌ ออกจากระบบล้มเหลว:", error);
    }
  };
  
  

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Color.colorCornflowerblue} />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // ปรับขนาดเป็นสี่เหลี่ยมจัตุรัส
      quality: 1,
    });
  
    if (!result.canceled) {
      setAccountPicture(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView />
      {/* Header */}
      <View style={styles.header}>
        {/* Avatar พร้อมกดเพื่อไปหน้า Profile */}
        <View>
        <Image
          source={
            profile?.account_picture
              ? { uri: profile.account_picture } // ✅ ใช้ URL ถ้ามีข้อมูล
              : require("../assets/3d-avatars--9.png") // ✅ ใช้รูปเดิมถ้าไม่มีข้อมูล
          }
          style={styles.avatar}
        />

        </View>

        <View>
          <Text style={styles.username}>{profile?.account_name || "ไม่ระบุ"}</Text>
          <Text style={styles.email}>{profile?.account_email || "ไม่พบอีเมล"}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar & User Info */}
        <Text style={styles.textTitle}>บัญชี</Text>
        <View style={styles.card}>
          <View style={[styles.detailContainer, { zIndex: 4000, elevation: 4000 }]}>
            <TextInput
              editable={edit}
              style={styles.textInput}
              placeholder="ชื่อ"
              placeholderTextColor="#aaa"
              value={name ?? ""}
              onChangeText={setName}
            />
          </View>

          <View style={styles.detailContainer}>
            <View style={{ zIndex: 4000}}>
            <DropDownPicker
                open={genderOpen} // ✅ ใช้ state ควบคุมการเปิด-ปิด
                value={gender} // ✅ ใช้ค่า gender ที่อัปเดตได้
                items={genderList}
                setOpen={setGenderOpen} // ✅ ควบคุมการเปิด dropdown
                setValue={setGender} // ✅ อนุญาตให้เปลี่ยนค่าเฉพาะเมื่อแก้ไข
                placeholder="เพศ"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                disabled={!edit} // ✅ ปิด dropdown ถ้าไม่ได้อยู่ในโหมดแก้ไข
              />
            </View>
          </View>
          <View style={[styles.detailContainer,{zIndex:1}]}>
            {/* Dropdown for Day */}
            <View style={{ zIndex: dayOpen ? 3000 : 1 }}>
              <DropDownPicker
                open={dayOpen}
                value={day ?? 0}
                items={days}
                setOpen={setDayOpen}
                setValue={setDay}
                placeholder="วัน"
                style={styles.dropdownDate}
                dropDownContainerStyle={styles.dropdownContainer}
                disabled={!edit}
              />
            </View>
            {/* Dropdown for Month */}
            <View style={{ zIndex: monthOpen ? 2000 : 1 }}>
              <DropDownPicker
                open={monthOpen}
                value={month ?? 0}
                items={months}
                setOpen={setMonthOpen}
                setValue={setMonth}
                placeholder="เดือน"
                style={styles.dropdownDate}
                dropDownContainerStyle={styles.dropdownContainer}
                disabled={!edit}
              />
            </View>
            <View style={{ zIndex: yearOpen ? 1000 : 1 }}>
              {/* Dropdown for Year */}
              <DropDownPicker
                open={yearOpen}
                value={year ?? 0}
                items={years}
                setOpen={setYearOpen}
                setValue={setYear}
                placeholder="ปี"
                style={styles.dropdownDate}
                dropDownContainerStyle={styles.dropdownContainer}
                disabled={!edit}
              />
            </View>
          </View>
          <View style={{zIndex:0}}>
            <View style={styles.detailContainer}>
              <TextInput
                style={styles.textInput}
                value={phone ?? ""}
                onChangeText={(text) => {
                  const numericText = text.replace(/[^0-9]/g, ""); // ✅ กรองเฉพาะตัวเลข
                  setPhone(numericText);
                }}
                placeholder="เบอร์โทรศัพท์"
                keyboardType="numeric"
                maxLength={12}
                editable={edit}
              />
            </View>
          </View>
          <View style={{ zIndex: 0 }}>
            <View style={styles.detailContainer}>
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Text style={styles.uploadButtonText}>
                  {account_picture ? "เปลี่ยนรูปภาพโปรไฟล์" : "เลือกไฟล์รูปภาพ"}
                </Text>
              </TouchableOpacity>
              
              {account_picture && <Image source={{ uri: account_picture }} style={styles.previewImage} />}
            </View>
          </View>
          <View style={{ zIndex: 0 }}>
            <View style={styles.detailContainer}>
              <TextInput
                style={styles.textInput}
                value={latitude !== null ? String(latitude) : ""}
                placeholder="ละติจูด"
                editable={edit}
                onChangeText={(text) => setLatitude(text ? parseFloat(text) : null)}
              />
            </View>
          </View>
          <View style={{ zIndex: 0 }}>
            <View style={styles.detailContainer}>
              <TextInput
                  style={styles.textInput}
                  value={longitude !== null ? `${longitude}` : ""}
                  placeholder="ลองจิจูด"
                  editable={edit}
                  onChangeText={(text) => setLongitude(text ? parseFloat(text) : null)}
                />
            </View>
          </View>

          <Text style={styles.textSubTitle}>ตำแหน่งของคุณ</Text>

          <LongdoMapView
            latitude={latitude ? latitude : 13.736717}  // Default: Bangkok
            longitude={longitude ? longitude : 100.523186}
          />

          <TouchableOpacity
            style={styles.gpsButton}
            onPress={getLocation} // เรียกใช้ฟังก์ชันดึงค่าพิกัด
          >
            <Text style={styles.gpsText}>อัปเดทตำแหน่ง</Text>
          </TouchableOpacity>
          {/* ปุ่มแก้ไขโปรไฟล์ */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              if (edit) {
                updateProfile(); // ✅ บันทึกเมื่อกด
              } else {
                setEdit(true); // ✅ เข้าโหมดแก้ไข
              }
            }}
          >
            <Text style={styles.editText}>{edit ? "บันทึก" : "แก้ไขโปรไฟล์"}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.editButton, { width: "40%", backgroundColor: "#B7B7B7", marginTop: 80 }]}
          onPress={signout} // ✅ เรียกใช้ฟังก์ชัน logout
        >
          <Text style={styles.editText}>ออกจากระบบ</Text>
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  username: {
    fontSize: FontSize.size_xl,
    fontFamily: FontFamily.nunitoBold,
    color: Color.colorBlack,
  },
  email: {
    fontSize: FontSize.size_mini,
    fontFamily: FontFamily.nunitoRegular,
    color: Color.gray1,
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
    paddingVertical: 20,
    paddingHorizontal:20
  },
  profileInfo: {
    alignItems: "center",
    marginBottom: 20,
  },

  editButton: {
    backgroundColor: Color.colorCornflowerblue,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: Border.br_81xl,
    width: "50%",
    alignSelf: "center",
  },
  editText: {
    fontSize: FontSize.size_base,
    fontFamily: FontFamily.nunitoBold,
    color: Color.colorWhite,
    textAlign: "center",
  },
  menuContainer: {
    width: "90%",
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Color.colorWhitesmoke_100,
  },
  menuText: {
    fontSize: FontSize.size_base,
    fontFamily: FontFamily.nunitoRegular,
    color: Color.colorBlack,
  },
  logout: {
    marginTop: 20,
  },
  logoutText: {
    color: "red",
    fontWeight: "bold",
  },
  dropdown: {
    width: "100%",
    borderColor: "#ccc",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 1,
    fontSize: 16,
    color: "#aaa",
  },
  dropdownDate: {
    width: 85,
    borderColor: "#ccc",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 1,
    fontSize: 12,
    color: "#aaa",
  },
  dropdownContainer: {
    borderColor: "#ccc",
  },
  textInput: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 1,
    fontSize: 16,
  },
  detailContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    zIndex:9
  },
  card: {
    borderRadius: 23,
    paddingVertical: 15,
    paddingHorizontal: 30,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 1,
    flex: 1,
    gap: 20,
    marginTop: 10
  },
  input: {
    width: "70%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    fontSize: 16,
    textAlign: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 1,
    backgroundColor: Color.colorWhite,
  },
  textTitle: {
    fontSize: FontSize.size_5xl,
    fontWeight: "bold",
  },
  textSubTitle: {
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: FontSize.size_base,
    marginTop: 10,
  },
  errorText: {
    fontSize: FontSize.size_base,
    color: "red",
  },
  gpsButton: {
    backgroundColor: "green",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: Border.br_81xl,
    alignSelf: "center",
    marginTop: 10,
  },
  gpsText: {
    fontSize: FontSize.size_base,
    fontFamily: FontFamily.nunitoBold,
    color: Color.colorWhite,
    textAlign: "center",
  },
  mapContainer: {
    marginTop: 20,
    borderRadius: 10,
    overflow: "hidden",
    alignSelf: "center",
    width: "100%",
    height: 200,
  },
  map: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  uploadButton: {
    width: "100%",
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginTop: 10,
  },
});

export default Profile;
