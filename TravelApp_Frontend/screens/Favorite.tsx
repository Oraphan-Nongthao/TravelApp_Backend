import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ImageProps,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App"; // นำเข้า Type ของ Stack Navigator
import { Color, FontFamily, FontSize, Border } from "../GlobalStyles";
import Carousel from "react-native-snap-carousel";
import CalendarIcon from "../assets/calendar.svg";
import MapIcon from "../assets/map.svg";
import TimeIcon from "../assets/time.svg";

const Favorite = () => {
  const [activeIndex, setActiveIndex] = React.useState<number>(0);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const renderItem = ({ item }: { item: ImageProps }) => (
    <View>
      <Image source={item} style={styles.image} />
    </View>
  );
  const { width: screenWidth } = Dimensions.get("screen");

  const places = [
    {
      name: "Shall I Compare Thee to a Summer’s Day?",
      description: "นิทรรศการกลุ่มครั้งแรกจาก 8 ศิลปินนักวาดภาพประกอบ",
      image: [
        require("../assets/image-23.png"),
        require("../assets/image-25.png"),
      ],
      distance: "3.2 กม.",
      address: "MOCA Museum of Contemporary Art",
      footer:
        "‘No Heart Here’ อาจแปลว่าตรงตัวได้ว่า ‘ที่ตรงนี้ไม่มีหัวใจ’ แต่สำหรับ Gongkan หรือ กันตภณ เมธีกุล No Heart Here คือนิทรรศการศิลปะชุดใหม่ล่าสุด ที่เจ้าตัวใช้เวลากว่า 3 ปี กลั่นกรองออกมา โดยนำเอาความทุกข์ ความเหงา ความเศร้า และความไม่สบายใจของตัวเอง ออกมาเป็นงานศิลปะ เพื่อหวังเยียวยาจิตใจของผู้ชมที่กำลังเกิดปัญหาหรือความเศร้าเช่นเดียวกัน",
      date: "14 กันยายน – 27 ตุลาคม 2567",
      time: "10:30 - 19:00 น.",
    },
    {
      name: "No Heart Here",
      description:
        "‘No Heart Here’ นิทรรศการศิลปะชุดใหม่ล่าสุดของ Gongkan ที่ใช้เวลากว่า 3 ปี ในการถ่ายทอดความเหงาและความเศร้าผ่านงานศิลปะ 14 ก.ย. – 27 ต.ค. 2567 MOCA Museum เวลาทำการ: 10:00 - 18:00 น.",
      image: [require("../assets/image-24.png")],
      distance: "4.5 กม.",
      address: "MOCA Museum of Contemporary Art",
      footer:
        "‘No Heart Here’ อาจแปลว่าตรงตัวได้ว่า ‘ที่ตรงนี้ไม่มีหัวใจ’ แต่สำหรับ Gongkan หรือ กันตภณ เมธีกุล No Heart Here คือนิทรรศการศิลปะชุดใหม่ล่าสุด ที่เจ้าตัวใช้เวลากว่า 3 ปี กลั่นกรองออกมา โดยนำเอาความทุกข์ ความเหงา ความเศร้า และความไม่สบายใจของตัวเอง ออกมาเป็นงานศิลปะ เพื่อหวังเยียวยาจิตใจของผู้ชมที่กำลังเกิดปัญหาหรือความเศร้าเช่นเดียวกัน",
      date: "14 กันยายน – 27 ตุลาคม 2567",
      time: "10:00 - 18:00 น.",
    },
  ];
  const [liked, setLiked] = React.useState<boolean[]>(places.map(() => false));
  const toggleLike = (index: number) => {
    setLiked((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  };
  return (
    <View style={styles.container}>
      <SafeAreaView />
      <View style={styles.header}>
    
        <Text style={styles.title}>สถานที่ที่คุณชอบ</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollView}>
        {places.map((place, index) => (
          <View style={styles.card}>
            <View>
              <View style={styles.dotContainer}>
                {place.image.map((_, indexs) => (
                  <View
                    key={indexs}
                    style={[
                      activeIndex === indexs
                        ? styles.activeDot
                        : styles.inactiveDot,
                    ]}
                  />
                ))}
              </View>
              <TouchableOpacity
                style={styles.like}
                onPress={() => toggleLike(index)}
              >
                <Image
                  source={
                    liked[index]
                      ? require("../assets/heart-select.png")
                      : require("../assets/heart-solid.png")
                  }
                />
              </TouchableOpacity>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.placeName}>{place.name}</Text>
              <Text style={styles.description}>{place.description}</Text>
              <View style={styles.details}>
                <CalendarIcon width={14} height={14} />
                <Text style={styles.description}>{place.date}</Text>
              </View>
              <View style={styles.details}>
                <MapIcon width={14} height={14} />
                <Text style={styles.description}>{place.address}</Text>
              </View>
              <View style={styles.details}>
                <TimeIcon width={14} height={14} />
                <Text style={styles.description}>{place.time}</Text>
              </View>
              <Text style={styles.description}>{place.footer}</Text>
            </View>
          </View>
        ))}
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
    borderBottomWidth: 1,
    borderBottomColor: Color.colorWhitesmoke_100,
  },
  backText: {
    fontSize: FontSize.size_base,
    color: Color.colorWhite,
  },
  title: {
    fontSize: FontSize.m3LabelMedium_size,
    fontFamily: FontFamily.nunitoBold,
    textAlign: "center",
  },
  scrollView: {
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  card: {
    backgroundColor: Color.colorWhitesmoke_200,
    borderRadius: Border.br_base,
    marginBottom: 20,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 129,
  },
  infoContainer: {
    padding: 15,
    flex: 1,
    gap: 5,
  },
  placeName: {
    fontSize: FontSize.size_2xs,
    fontFamily: FontFamily.nunitoBold,
    color: Color.colorBlack,
  },
  description: {
    fontSize: FontSize.size_3xs,
    fontFamily: FontFamily.nunitoRegular,
  },
  details: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: FontSize.size_mini,
    fontFamily: FontFamily.nunitoRegular,
    color: Color.colorBlack,
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
    fontSize: FontSize.size_3xs,
    fontFamily: FontFamily.nunitoBold,
    color: Color.colorWhite,
  },
  activeDot: {
    backgroundColor: Color.colorWhite,
    width: 8,
    height: 8,
    borderRadius: 5,
    marginHorizontal: 3,
  },
  inactiveDot: {
    backgroundColor: Color.colorGray_100,
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  dotContainer: {
    flexDirection: "row",
    position: "absolute",
    bottom: 10,
    left: "50%",
    transform: [{ translateX: -15 }],
  },
  like: {
    position: "absolute",
    right: 10,
    top: 10,
  },
});

export default Favorite;
