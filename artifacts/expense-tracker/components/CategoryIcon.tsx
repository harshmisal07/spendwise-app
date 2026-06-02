import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { getCategoryById } from "@/constants/categories";

type Props = {
  categoryId: string;
  size?: number;
  iconSize?: number;
};

export function CategoryIcon({ categoryId, size = 44, iconSize = 22 }: Props) {
  const cat = getCategoryById(categoryId);
  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: cat.color + "22" },
      ]}
    >
      <Ionicons name={cat.icon as any} size={iconSize} color={cat.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
