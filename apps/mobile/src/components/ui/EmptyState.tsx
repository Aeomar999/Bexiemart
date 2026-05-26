import { View, Text } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";

interface EmptyStateProps {
  icon: string | React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  // deprecated props kept for backwards compatibility during migration
  iconColor?: string;
  iconBgColor?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  className = ""
}: EmptyStateProps) {
  const isEmoji = typeof icon === 'string' && /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u.test(icon);
  const isString = typeof icon === 'string';

  return (
    <View className={`items-center justify-center py-20 px-8 ${className}`}>
      <View className="w-16 h-16 rounded-full bg-muted items-center justify-center mb-4">
        {isEmoji ? (
          <Text className="text-[24px]">{icon}</Text>
        ) : isString ? (
          <Icon name={icon as any} size={24} color="#64748b" />
        ) : (
          icon
        )}
      </View>
      <Text className="text-[16px] font-bold text-foreground text-center">
        {title}
      </Text>
      <Text className="text-[14px] text-muted-foreground mt-1 text-center max-w-[280px]">
        {description}
      </Text>
      {actionLabel && onAction ? (
        <View className="mt-6">
          <Button 
            title={actionLabel} 
            size="md" 
            onPress={onAction}
            className="rounded-full px-8"
          />
        </View>
      ) : null}
    </View>
  );
}