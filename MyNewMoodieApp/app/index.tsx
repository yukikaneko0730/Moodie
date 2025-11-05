// app/index.tsx
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
  const [previewUri, setPreviewUri] = useState<string | undefined>();
  const [isEditing, setIsEditing] = useState(false);

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

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted)
      return Alert.alert("Permission", "Please allow photo library access.");
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!res.canceled) {
      setPhotoUri(res.assets[0].uri);
      setPreviewUri(res.assets[0].uri);
    }
  };

  const saveEntry = async () => {
    if (!selectedMood) return Alert.alert("Pick your mood first!");
    const newEntry: Entry = { date: selectedDate, mood: selectedMood, photoUri, note };
    const updated = entries.filter((e) => e.date !== selectedDate).concat(newEntry);
    await AsyncStorage.setItem("entries", JSON.stringify(updated));
    setEntries(updated);
    setPhotoUri(undefined);
    setPreviewUri(undefined);
    setNote("");
    setIsEditing(false);
    Alert.alert("Saved", isEditing ? "Updated ✏️" : "Mood pinned 📎");
  };

  const deleteEntry = async (date: string) => {
    Alert.alert("Delete Entry", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updated = entries.filter((e) => e.date !== date);
          await AsyncStorage.setItem("entries", JSON.stringify(updated));
          setEntries(updated);
          if (selectedDate === date) {
            setPhotoUri(undefined);
            setPreviewUri(undefined);
            setNote("");
            setSelectedMood(null);
          }
        },
      },
    ]);
  };

  const startEdit = (entry: Entry) => {
    setSelectedMood(entry.mood);
    setNote(entry.note || "");
    setPhotoUri(entry.photoUri);
    setPreviewUri(entry.photoUri);
    setIsEditing(true);
  };

  const entryOfDay = findEntry(selectedDate);

  return (
    <View style={styles.wrap}>
      {/* 📅 */}
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
        }}
        dayComponent={({ date, state }) => {
          if (!date) return null;
          const e = findEntry(date.dateString);
          const isToday = date.dateString === todayStr();
          const tilt = e ? (Math.random() * 6 - 3).toFixed(2) : "0";
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
                    from={{
                      translateY: -50,
                      opacity: 0,
                      rotate: `${Number(tilt) - 5}deg`,
                    }}
                    animate={{
                      translateY: 0,
                      opacity: 1,
                      rotate: `${tilt}deg`,
                    }}
                    transition={{ type: "timing", duration: 1200 }}
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

      {/* day */}
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 1000 }}
      >
        <Text style={styles.dateLabel}>📅 {selectedDate}</Text>
      </MotiView>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* card */}
        <View style={styles.moodWrap}>
          {MOODS.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[
                styles.moodTag,
                {
                  backgroundColor:
                    selectedMood === m.key ? m.color : "rgba(255,255,255,0.6)",
                },
              ]}
              onPress={() => setSelectedMood(m.key)}
            >
              <Text style={styles.moodText}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* cheki */}
        {entryOfDay ? (
          <MotiView
            from={{ opacity: 0, scale: 0.8, translateY: -50 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 1200 }}
            style={[styles.polaroidCard, { borderColor: getMoodColor(entryOfDay.mood) }]}
          >
            <View style={styles.cardActions}>
              <TouchableOpacity
                onPress={() => startEdit(entryOfDay)}
                activeOpacity={0.8}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.actionIcon}>✏️</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => deleteEntry(entryOfDay.date)}
                activeOpacity={0.8}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.actionIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>

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

        {/* ノート風記入欄 */}
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

        {/* プレビュー */}
        {previewUri && (
          <MotiView
            from={{ opacity: 0, scale: 0.9, translateY: -20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 1000 }}
            style={[
              styles.previewFrame,
              { borderColor: getMoodColor(selectedMood) },
            ]}
          >
            <Image source={{ uri: previewUri }} style={styles.previewImage} />
          </MotiView>
        )}

        {/* ボタン */}
        <TouchableOpacity onPress={pickImage} activeOpacity={0.85} style={styles.pickBtn}>
          <Text style={styles.pickBtnText}>Pick a photo 📸</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={saveEntry} activeOpacity={0.9} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>{isEditing ? "💾 Update" : "💾 Save"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#F6F6F5" },
  calendar: { marginTop: 20, marginHorizontal: 14 },
  dayCell: { alignItems: "center", justifyContent: "center", marginVertical: 4 },
  dayText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: "#444" },
  todayFlower: { position: "absolute", bottom: 0, fontSize: 13 },
  moodWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 16,
    gap: 10,
  },
  moodTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E6E6E6",
  },
  moodText: { fontFamily: "Poppins_500Medium", fontSize: 14, color: "#555" },
  notePaper: {
    position: "relative",
    marginTop: 18,
    marginHorizontal: 18,
    backgroundColor: "#FFFDF6",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E9E3D7",
    paddingLeft: 22,
    paddingRight: 14,
    paddingVertical: 12,
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
  previewFrame: {
    alignSelf: "center",
    width: 180,
    height: 200,
    borderWidth: 6,
    borderRadius: 12,
    backgroundColor: "#FFF",
    marginTop: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: "85%",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    resizeMode: "cover",
  },
  cardActionsBottom: {
    position: "absolute",
    right: 10,
    bottom: 8,
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  actionText: { fontSize: 18, opacity: 0.85 },
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
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  saveBtnText: { color: "#333", fontSize: 16, fontFamily: "Poppins_600SemiBold" },
  empty: {
    textAlign: "center",
    marginTop: 12,
    color: "#888",
    fontFamily: "Poppins_400Regular",
  },
  // 🩶 
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
    shadowOffset: { width: 0, height: 2 },
  },

  // 🧷
  pin: {
    position: "absolute",
    top: -6,
    right: -4,
    fontSize: 11,
  },

  // 📸 
  polaroidImage: {
    width: 30,
    height: 30,
    borderRadius: 5,
  },

  // 😄 
  emoji: {
    fontSize: 16,
  },

  // 📅 
  dateLabel: {
    textAlign: "center",
    marginTop: 10,
    fontFamily: "Poppins_600SemiBold",
    color: "#444",
  },

  cardActions: {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  gap: 6,
  marginTop: 8,
},

actionIcon: {
  fontSize: 15, // 少し小さく
  opacity: 0.8,
  paddingHorizontal: 6,
},


});
