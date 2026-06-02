import colors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";

export function useColors() {
  const { resolvedColorScheme } = useTheme();
  const palette = resolvedColorScheme === "dark" ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
