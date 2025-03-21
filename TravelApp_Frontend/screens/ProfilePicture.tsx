import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { Color, FontFamily, FontSize, Border, Padding } from "../GlobalStyles";

const ProfilePicture = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [profileImage, setProfileImage] = React.useState<string | null>(null);

  // ขอ Permission ก่อนใช้งาน Image Picker
  React.useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "ต้องอนุญาตให้เข้าถึงแกลเลอรี่เพื่อเปลี่ยนรูปโปรไฟล์");
      }
    })();
  }, []);

  // ฟังก์ชันเลือกภาพจากแกลเลอรี่
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  // ฟังก์ชันบันทึกรูปภาพ
  const handleSave = () => {
    Alert.alert("สำเร็จ", "บันทึกโปรไฟล์ใหม่แล้ว!");
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>ยกเลิก</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>แก้ไขรูปโปรไฟล์</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>บันทึก</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Picture Preview */}
      <View style={styles.profileContainer}>
        <Image
          source={
            profileImage
              ? { uri: profileImage }
              : require("../assets/3d-avatars--9.png")
          }
          style={styles.profileImage}
        />
      </View>

      {/* Change Profile Picture Button */}
      <TouchableOpacity style={styles.changeButton} onPress={pickImage}>
        <Text style={styles.changeText}>เลือกภาพจากแกลเลอรี่</Text>
      </TouchableOpacity>
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Color.colorCornflowerblue,
  },
  cancelText: {
    fontSize: FontSize.size_base,
    color: Color.colorWhite,
  },
  headerTitle: {
    fontSize: FontSize.size_xl,
    fontFamily: FontFamily.nunitoBold,
    color: Color.colorWhite,
  },
  saveText: {
    fontSize: FontSize.size_base,
    color: Color.colorWhite,
  },
  profileContainer: {
    alignItems: "center",
    marginTop: 30,
  },
  profileImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: Color.colorCornflowerblue,
  },
  changeButton: {
    marginTop: 20,
    backgroundColor: Color.colorCornflowerblue,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: Border.br_81xl,
    alignSelf: "center",
  },
  changeText: {
    fontSize: FontSize.size_base,
    fontFamily: FontFamily.nunitoBold,
    color: Color.colorWhite,
  },
});

export default ProfilePicture;
