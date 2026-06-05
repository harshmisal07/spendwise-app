import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

export type VoiceResult = {
  transcript: string;
  amount?: number;
  type?: "expense" | "income";
  category?: string;
  note?: string;
};

type VoiceInputProps = {
  visible: boolean;
  onResult: (result: VoiceResult) => void;
  onClose: () => void;
};

const EXPENSE_KEYWORDS = ["spent", "expense", "paid", "bought", "spend", "purchase", "खर्च", "खरेदी", "विकत"];
const INCOME_KEYWORDS = ["received", "earned", "income", "salary", "got", "मिळाले", "कमाई", "income", "मिळाली"];

function parseTranscript(text: string): VoiceResult {
  const lower = text.toLowerCase();
  const result: VoiceResult = { transcript: text };

  const isExpense = EXPENSE_KEYWORDS.some((k) => lower.includes(k));
  const isIncome  = INCOME_KEYWORDS.some((k)  => lower.includes(k));
  result.type = isExpense ? "expense" : isIncome ? "income" : undefined;

  const amountMatch = text.match(/(?:₹\s*)?(\d[\d,]*(?:\.\d{1,2})?)/);
  if (amountMatch) {
    result.amount = parseFloat(amountMatch[1].replace(/,/g, ""));
  }

  const categoryMap: Record<string, string> = {
    food: "food", restaurant: "food", lunch: "food", dinner: "food", breakfast: "food",
    खाणे: "food", जेवण: "food",
    shopping: "shopping", clothes: "shopping", shirt: "shopping", shoes: "shopping",
    खरेदी: "shopping",
    travel: "travel", uber: "travel", ola: "travel", cab: "travel", bus: "travel", train: "travel",
    प्रवास: "travel",
    bills: "bills", electricity: "bills", water: "bills", internet: "bills", mobile: "bills",
    बिल: "bills",
    health: "health", doctor: "health", medicine: "health", hospital: "health",
    आरोग्य: "health",
    entertainment: "entertainment", movie: "entertainment", netflix: "entertainment",
    salary: "salary", पगार: "salary",
    freelance: "freelance",
    rent: "rent", किराया: "rent", भाडे: "rent",
    emi: "emi",
    insurance: "insurance", विमा: "insurance",
  };

  for (const [keyword, category] of Object.entries(categoryMap)) {
    if (lower.includes(keyword)) { result.category = category; break; }
  }

  const forMatch = text.match(/(?:for|on|for)\s+(.{3,30})(?:\s+of|\s+worth|$)/i);
  if (forMatch) result.note = forMatch[1].trim();

  return result;
}

export default function VoiceInput({ visible, onResult, onClose }: VoiceInputProps) {
  const colors = useColors();
  const [status, setStatus] = useState<"idle" | "listening" | "processing" | "error">("idle");
  const [transcript, setTranscript] = useState("");
  const [lang, setLang] = useState<"en-IN" | "hi-IN" | "mr-IN">("en-IN");
  const recognitionRef = useRef<any>(null);

  const supportsVoice = Platform.OS === "web" && typeof window !== "undefined"
    && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    if (!visible) { stopListening(); setTranscript(""); setStatus("idle"); }
  }, [visible]);

  function startListening() {
    if (!supportsVoice) {
      Alert.alert(
        "Voice Unavailable",
        "Voice input works on supported browsers. On the mobile app, tap the mic to use your device's keyboard voice input.",
      );
      return;
    }
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onstart = () => setStatus("listening");
      recognition.onresult = (event: any) => {
        const t = Array.from(event.results as any[])
          .map((r: any) => r[0].transcript)
          .join(" ");
        setTranscript(t);
        if (event.results[event.results.length - 1].isFinal) {
          setStatus("processing");
          const parsed = parseTranscript(t);
          setTimeout(() => { onResult(parsed); }, 400);
        }
      };
      recognition.onerror = () => setStatus("error");
      recognition.onend = () => { if (status === "listening") setStatus("idle"); };

      recognitionRef.current = recognition;
      recognition.start();
    } catch { setStatus("error"); }
  }

  function stopListening() {
    try { recognitionRef.current?.stop(); } catch {}
    recognitionRef.current = null;
    setStatus("idle");
  }

  const LANGS: Array<{ code: "en-IN" | "hi-IN" | "mr-IN"; label: string; flag: string }> = [
    { code: "en-IN", label: "English", flag: "🇬🇧" },
    { code: "hi-IN", label: "हिंदी", flag: "🇮🇳" },
    { code: "mr-IN", label: "मराठी", flag: "🟠" },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <Text style={[styles.title, { color: colors.foreground }]}>Voice Input</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {!supportsVoice
              ? "Voice input available on supported browsers"
              : 'Say something like "Spent ₹500 on food" or "Received ₹5000 salary"'}
          </Text>

          <View style={styles.langRow}>
            {LANGS.map((l) => (
              <TouchableOpacity
                key={l.code}
                onPress={() => setLang(l.code)}
                style={[styles.langBtn, {
                  backgroundColor: lang === l.code ? "#6C5CE720" : colors.background,
                  borderColor: lang === l.code ? "#6C5CE7" : colors.border,
                }]}
              >
                <Text style={styles.langFlag}>{l.flag}</Text>
                <Text style={[styles.langLabel, { color: lang === l.code ? "#6C5CE7" : colors.mutedForeground }]}>
                  {l.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={status === "listening" ? stopListening : startListening}
            disabled={status === "processing"}
            style={[styles.micBtn, {
              backgroundColor:
                status === "listening" ? "#FF6B6B20" :
                status === "processing" ? "#FDCB6E20" :
                "#6C5CE720",
              borderColor:
                status === "listening" ? "#FF6B6B" :
                status === "processing" ? "#FDCB6E" :
                "#6C5CE7",
            }]}
          >
            {status === "processing" ? (
              <ActivityIndicator color="#FDCB6E" size={36} />
            ) : (
              <Ionicons
                name={status === "listening" ? "stop-circle" : "mic"}
                size={48}
                color={status === "listening" ? "#FF6B6B" : "#6C5CE7"}
              />
            )}
          </TouchableOpacity>

          {status === "listening" && (
            <View style={styles.listeningRow}>
              {[0, 1, 2, 3, 4].map((i) => (
                <View key={i} style={[styles.waveBar, { backgroundColor: "#FF6B6B", height: 8 + (i % 3) * 10 }]} />
              ))}
              <Text style={[styles.listeningText, { color: "#FF6B6B" }]}>Listening…</Text>
              {[4, 3, 2, 1, 0].map((i) => (
                <View key={`r${i}`} style={[styles.waveBar, { backgroundColor: "#FF6B6B", height: 8 + (i % 3) * 10 }]} />
              ))}
            </View>
          )}

          {transcript !== "" && (
            <View style={[styles.transcriptBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.transcriptLabel, { color: colors.mutedForeground }]}>Recognized:</Text>
              <Text style={[styles.transcriptText, { color: colors.foreground }]}>{transcript}</Text>
            </View>
          )}

          <View style={styles.exampleRow}>
            {[
              "Spent ₹200 on food",
              "Received ₹5000 salary",
              "Paid ₹1500 rent",
            ].map((ex) => (
              <TouchableOpacity
                key={ex}
                onPress={() => { setTranscript(ex); const r = parseTranscript(ex); setStatus("processing"); setTimeout(() => onResult(r), 300); }}
                style={[styles.exampleChip, { backgroundColor: colors.background, borderColor: colors.border }]}
              >
                <Text style={[styles.exampleText, { color: colors.mutedForeground }]}>{ex}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { borderColor: colors.border }]}>
            <Text style={[styles.closeBtnText, { color: colors.foreground }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, gap: 16 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19 },
  langRow: { flexDirection: "row", gap: 8 },
  langBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5 },
  langFlag: { fontSize: 16 },
  langLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  micBtn: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", alignSelf: "center", borderWidth: 2 },
  listeningRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
  waveBar: { width: 4, borderRadius: 2 },
  listeningText: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginHorizontal: 8 },
  transcriptBox: { borderRadius: 14, padding: 14, borderWidth: 1 },
  transcriptLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 4 },
  transcriptText: { fontSize: 15, fontFamily: "Inter_500Medium", lineHeight: 22 },
  exampleRow: { gap: 6 },
  exampleChip: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  exampleText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  closeBtn: { borderRadius: 14, height: 50, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  closeBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
