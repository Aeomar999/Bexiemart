import { View } from "react-native";
import { ReactNode } from "react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Icon } from "./Icon";

/** Canonical height for entity cover headers (store / restaurant profiles). */
export const COVER_HEIGHT = 220;

interface CoverHeaderProps {
  /** Cover image URL. Falls back to an icon block when absent. */
  imageUrl?: string | null;
  /** Cover height in px. Defaults to the canonical COVER_HEIGHT. */
  height?: number;
  /** Feather icon shown in the fallback state. */
  fallbackIcon?: string;
  fallbackIconColor?: string;
  /** Tailwind bg class for the fallback block. */
  fallbackClassName?: string;
  /** Optional image opacity (e.g. dimmed brand covers). */
  imageOpacity?: number;
  /** Render a bottom gradient so overlaid text stays readable. */
  overlay?: boolean;
  /** Overlaid content (e.g. title/subtitle), pinned to the bottom above the gradient. */
  children?: ReactNode;
}

/**
 * Reusable full-width cover image for entity profile pages (store, restaurant,
 * vendor profile). Standardises height, fallback, image fit (`contentFit`), and
 * the optional readability gradient so every cover is consistent. Screens keep
 * their own overlapping avatar/info card below this block.
 */
export function CoverHeader({
  imageUrl,
  height = COVER_HEIGHT,
  fallbackIcon = "image",
  fallbackIconColor = "#94a3b8",
  fallbackClassName = "bg-secondary",
  imageOpacity = 1,
  overlay = false,
  children,
}: CoverHeaderProps) {
  return (
    <View style={{ height }} className="w-full relative overflow-hidden">
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ position: "absolute", width: "100%", height: "100%", opacity: imageOpacity }}
          contentFit="cover"
        />
      ) : (
        <View className={`absolute w-full h-full items-center justify-center ${fallbackClassName}`}>
          <Icon name={fallbackIcon} size={48} color={fallbackIconColor} />
        </View>
      )}

      {overlay && (
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.65)"]}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: height * 0.7 }}
        />
      )}

      {children ? (
        <View className="absolute bottom-0 left-0 right-0 p-5 z-10">{children}</View>
      ) : null}
    </View>
  );
}
