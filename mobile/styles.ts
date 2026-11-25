import { Platform, StatusBar, StyleSheet } from "react-native";

export const colors = {
  background: "#edf2f5",
  white: "#ffffff",
  ink: "#132638",
  muted: "#465d70",
  line: "#cfdce5",
  brand: "#0c5d55",
  tint: "#deefe9",
  error: "#8b2836",
  errorBackground: "#faebee",
};

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  page: {
    width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 16,
    paddingTop: 18 + (Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0), paddingBottom: 40, gap: 12,
  },
  loginPage: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 18 },
  loginCard: {
    width: "100%", maxWidth: 440, backgroundColor: colors.white, borderColor: colors.line,
    borderWidth: 1, borderRadius: 20, padding: 24, gap: 12,
  },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  brand: { flexDirection: "row", alignItems: "center", gap: 9, flexShrink: 1 },
  brandIcon: { backgroundColor: colors.brand, padding: 10, borderRadius: 12 },
  brandInitials: { color: colors.white, fontWeight: "800", letterSpacing: 0.5 },
  brandName: { fontSize: 16, color: colors.ink, fontWeight: "800", flexShrink: 1 },
  title: { color: colors.ink, fontSize: 28, fontWeight: "800", flexShrink: 1 },
  muted: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  label: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  input: {
    minHeight: 48, borderWidth: 1, borderColor: colors.line, borderRadius: 10,
    backgroundColor: colors.white, color: colors.ink, padding: 11, fontSize: 16,
  },
  button: {
    alignItems: "center", justifyContent: "center", minHeight: 44, borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, flexShrink: 1,
  },
  buttonText: { color: colors.white, fontSize: 14, fontWeight: "700", textAlign: "center" },
  primary: { backgroundColor: colors.brand, borderColor: colors.brand },
  secondary: { backgroundColor: colors.white, borderColor: colors.line },
  secondaryText: { color: colors.ink },
  danger: { backgroundColor: colors.error, borderColor: colors.error },
  dim: { opacity: 0.62 },
  tabs: {
    flexDirection: "row", flexWrap: "wrap", gap: 5, backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 5,
  },
  tab: { flexGrow: 1, minHeight: 44, justifyContent: "center", alignItems: "center", paddingHorizontal: 6, borderRadius: 9 },
  selectedTab: { backgroundColor: colors.tint, borderColor: colors.brand },
  tabText: { color: colors.muted, fontSize: 13, fontWeight: "700" },
  selectedText: { color: colors.brand },
  sectionHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 7 },
  panel: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 15, padding: 16, gap: 14 },
  row: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10,
    minHeight: 70, padding: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 13,
  },
  rowCopy: { flex: 1, gap: 4 },
  rowTitle: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  chevron: { fontSize: 26, color: colors.brand },
  detailLine: { borderBottomColor: colors.line, borderBottomWidth: 1, paddingBottom: 9, gap: 4 },
  detailValue: { fontSize: 16, color: colors.ink },
  field: { gap: 7 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    minHeight: 44, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 6,
    justifyContent: "center", borderWidth: 1, borderColor: colors.line, maxWidth: "100%",
  },
  notice: {
    backgroundColor: colors.errorBackground, color: colors.error, padding: 11, borderRadius: 9,
    lineHeight: 21, fontWeight: "600",
  },
  success: {
    backgroundColor: colors.tint, color: colors.brand, padding: 11, borderRadius: 9,
    lineHeight: 21, fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1, backgroundColor: "#13263866", alignItems: "center", justifyContent: "center", padding: 20,
  },
  modal: { width: "100%", maxWidth: 380, padding: 20, borderRadius: 15, backgroundColor: colors.white, gap: 14 },
});
