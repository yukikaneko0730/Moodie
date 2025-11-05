// app/index.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { Calendar } from "react-native-calendars";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MotiView } from "moti";

// 🌿 Mood 
const MOODS = [
  { key: "joyful", label: "😊 Joyful", color: "#F5DDE0" },
  { key: "loving", label: "💖 Loving", color: "#F2C9C0" },
  { key: "grateful", label: "🌞 Grateful", color: "#F6E1C3" },
  { key: "calm", label: "🌿 Calm", color: "#D6E6DA" },
  { key: "sad", label: "🌧 Sad", color: "#CFE0EC" },
  { key: "frustrated", label: "😤 Frustrated", color: "#E6C1BA" },
  { key: "relaxed", label: "😌 Relaxed", color: "#EDE6D7" },
  { key: "anxious", label: "😳 Anxious", color: "#E2DDEE" },
  { key: "excited", label: "🤩 Excited", color: "#FFE0CC" },
  { key: "tired", label: "💤 Tired", color: "#E4E2EE" },
] as const;

type MoodKey = (typeof MOODS)[number]["key"];
type Entry = { date: string; mood: MoodKey; photoUri?: string; note?: string };

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [selectedMood, setSelectedMood] = useState<MoodKey | null>(null);
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [note, setNote] = useState("");

  // --- data ---
  useEffect(() => {
    (async () => {
      const data = await AsyncStorage.getItem("entries");
      if (data) setEntries(JSON.parse(data));
    })();
  }, []);

  const findEntry = (date: string) => entries.find((e) => e.date === date);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    entries.forEach((e) => (marks[e.date] = { marked: true }));
    return marks;
  }, [entries]);

  const getMoodColor = (m: MoodKey | null) =>
    MOODS.find((x) => x.key === m)?.color || "#DDD";
  const getMoodEmoji = (m: MoodKey | undefined) =>
    MOODS.find((x) => x.key === m)?.label.split(" ")[0] || "📝";

  // --- 📷 ---
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted)
      return Alert.alert("Permission", "Please allow photo library access.");
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!res.canceled) setPhotoUri(res.assets[0].uri);
  };

  // --- 💾 ---
  const saveEntry = async () => {
    if (!selectedMood) return Alert.alert("Pick your mood first!");
    const newEntry: Entry = { date: selectedDate, mood: selectedMood, photoUri, note };
    const updated = entries.filter((e) => e.date !== selectedDate).concat(newEntry);
    await AsyncStorage.setItem("entries", JSON.stringify(updated));
    setEntries(updated);
    setPhotoUri(undefined);
    setNote("");
    Alert.alert("Saved", "Mood pinned to your calendar 📎");
  };

  const entryOfDay = findEntry(selectedDate);

  return (
    <View style={styles.wrap}>
      {/* 📅  */}
      <Calendar
        onDayPress={(d) => setSelectedDate(d.dateString)}
        markedDates={markedDates}
        style={styles.calendar}
        theme={{
          backgroundColor: "transparent",
          calendarBackground: "transparent",
          textSectionTitleColor: "#9C9C9C",
          monthTextColor: "#444",
          todayTextColor: "#777",
          arrowColor: "#999",
          textDayFontFamily: "Poppins_400Regular",
        }}
        dayComponent={({ date, state }) => {
          if (!date) return null;
          const e = findEntry(date.dateString);
          const isToday = date.dateString === todayStr();
          const tilt = e ? (Math.random() * 8 - 4).toFixed(2) : "0";
          return (
            <TouchableOpacity onPress={() => setSelectedDate(date.dateString)}>
              <View style={styles.dayCell}>
                <Text
                  style={[
                    styles.dayText,
                    {
                      color: state === "disabled" ? "#CCC" : "#444",
                      fontWeight: isToday ? "600" : "400",
                    },
                  ]}
                >
                  {date.day}
                </Text>

                {isToday && <Text style={styles.todayFlower}>🌸</Text>}

                {e && (
                  <MotiView
                    from={{ rotate: `${Number(tilt) - 3}deg`, scale: 0.9, opacity: 0 }}
                    animate={{ rotate: `${tilt}deg`, scale: 1, opacity: 1 }}
                    transition={{ type: "timing", duration: 400 }}
                    style={[
                      styles.polaroidMini,
                      { borderColor: getMoodColor(e.mood) },
                    ]}
                  >
                    {e.photoUri ? (
                      <Image source={{ uri: e.photoUri }} style={styles.polaroidImage} />
                    ) : (
                      <Text style={styles.emoji}>{getMoodEmoji(e.mood)}</Text>
                    )}
                    <Text style={styles.pin}>📎</Text>
                  </MotiView>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* 📅 */}
      <MotiView
        from={{ opacity: 0, translateY: -6 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 500 }}
      >
        <Text style={styles.dateLabel}>📅 {selectedDate}</Text>
      </MotiView>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* 💳 */}
        {entryOfDay ? (
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "timing", duration: 300 }}
            style={[styles.polaroidCard, { borderColor: getMoodColor(entryOfDay.mood) }]}
          >
            {entryOfDay.photoUri ? (
              <Image source={{ uri: entryOfDay.photoUri }} style={styles.polaroidLarge} />
            ) : (
              <Text style={styles.emojiBig}>{getMoodEmoji(entryOfDay.mood)}</Text>
            )}
            <Text style={styles.polaroidMood}>{entryOfDay.mood}</Text>
            {entryOfDay.note && <Text style={styles.polaroidNote}>✏️ {entryOfDay.note}</Text>}
          </MotiView>
        ) : (
          <Text style={styles.empty}>No mood recorded for this day.</Text>
        )}

        {/* 😃 */}
        <View style={styles.moodWrap}>
          {MOODS.map((m, i) => {
            const selected = selectedMood === m.key;
            const tilt = ((i % 3) - 1) * 2.2;
            return (
              <TouchableOpacity key={m.key} onPress={() => setSelectedMood(m.key)} activeOpacity={0.9}>
                <MotiView
                  from={{ rotate: `${tilt - 1}deg`, scale: 1 }}
                  animate={{ rotate: `${tilt}deg`, scale: selected ? 1.06 : 1 }}
                  transition={{ type: "timing", duration: 180 }}
                  style={[
                    styles.sticky,
                    {
                      backgroundColor: m.color,
                      borderColor: selected ? "#555" : "rgba(0,0,0,0.08)",
                      shadowOpacity: selected ? 0.12 : 0.06,
                    },
                  ]}
                >
                  <Text style={styles.stickyText}>{m.label}</Text>
                </MotiView>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ✏️ 📕 */}
        <View style={styles.notePaper}>
          <View style={styles.marginLine} />
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Write your feeling here ✏️"
            placeholderTextColor="#A4A4A4"
            style={styles.noteInput}
            multiline
          />
        </View>

        {/* 🔘 */}
        <TouchableOpacity onPress={pickImage} activeOpacity={0.85} style={styles.pickBtn}>
          <Text style={styles.pickBtnText}>Pick a photo 📸</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={saveEntry} activeOpacity={0.9} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>💾 Save</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// 🎨 
const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#F6F6F5" },
  calendar: { marginTop: 20, marginHorizontal: 14 },
  dayCell: { alignItems: "center", justifyContent: "center", marginVertical: 4 },
  dayText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: "#444" },
  todayFlower: { position: "absolute", bottom: 0, fontSize: 13 },
  polaroidMini: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 2,
    backgroundColor: "#FFF",
    marginTop: 3,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  pin: { position: "absolute", top: -8, right: -4, fontSize: 12 },
  polaroidImage: { width: 30, height: 30, borderRadius: 5 },
  emoji: { fontSize: 16 },
  dateLabel: {
    textAlign: "center",
    marginTop: 10,
    fontFamily: "Poppins_600SemiBold",
    color: "#444",
  },
  empty: {
    textAlign: "center",
    marginTop: 12,
    color: "#888",
    fontFamily: "Poppins_400Regular",
  },
  moodWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 14,
    paddingHorizontal: 10,
  },
  sticky: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 6,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: "#000",
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  stickyText: {
    color: "#333",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  polaroidCard: {
    alignSelf: "center",
    backgroundColor: "#FFF",
    borderWidth: 4,
    borderRadius: 14,
    padding: 10,
    marginTop: 14,
    width: 220,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  polaroidLarge: { width: "100%", height: 180, borderRadius: 10 },
  emojiBig: { fontSize: 40, textAlign: "center" },
  polaroidMood: {
    marginTop: 8,
    color: "#444",
    textAlign: "center",
    fontFamily: "Poppins_600SemiBold",
  },
  polaroidNote: {
    color: "#666",
    marginTop: 6,
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
  },
  notePaper: {
    position: "relative",
    marginTop: 18,
    marginHorizontal: 18,
    backgroundColor: "#FFFDF6",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E9E3D7",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    paddingLeft: 22,
    paddingRight: 14,
    paddingVertical: 12,
    minHeight: 56,
  },
  marginLine: {
    position: "absolute",
    top: 10,
    bottom: 10,
    left: 14,
    width: 2,
    backgroundColor: "#E88B8B",
    borderRadius: 2,
  },
  noteInput: {
    minHeight: 44,
    color: "#444",
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    textAlign: "left",
  },
  pickBtn: {
    alignSelf: "center",
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FFF",
  },
  pickBtnText: { color: "#444", fontFamily: "Poppins_600SemiBold" },
  saveBtn: {
    alignSelf: "center",
    backgroundColor: "#FFF",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 16,
    marginBottom: 26,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  saveBtnText: {
    color: "#333",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
});
