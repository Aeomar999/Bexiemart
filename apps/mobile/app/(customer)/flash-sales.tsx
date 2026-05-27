import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, FlatList, Dimensions, Pressable, Share, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect } from "react";
import { Image } from "expo-image";
import { useActiveFlashSales } from "@/lib/hooks/use-flash-sales";

const { width } = Dimensions.get('window');

export default function FlashSalesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: activeSales, isLoading } = useActiveFlashSales();
  const sale = activeSales?.[0];
  const items = sale?.items ?? [];
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!sale?.endDate) return;
    const calc = () => {
      const diff = new Date(sale.endDate).getTime() - Date.now();
      if (diff <= 0) return;
      setTimeLeft({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const timer = setInterval(calc, 1000);
    return () => clearInterval(timer);
  }, [sale?.endDate]);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <View className="flex-1 bg-background">
      {/* Header Gradient */}
      <LinearGradient
        colors={['#ef4444', '#f97316']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: (insets.top || 12) + 12, paddingBottom: 24, paddingHorizontal: 20 }}
        className="rounded-b-[32px] shadow-sm"
      >
        <View className="flex-row items-center justify-between mb-6">
          <BackButton className="bg-black/20" />
          <Text className="text-[20px] font-heading font-black text-white">Flash Sales</Text>
          <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]} 
            className="w-10 h-10 rounded-full bg-black/20 items-center justify-center" 
            onPress={() => Share.share({ message: "Check out this flash sale on Bexiemart!" })}
          >
            <Icon name="share-2" size={18} color="#fff" />
          </Pressable>
        </View>

        <View className="items-center mb-2">
          <Text className="text-white/90 text-body-md font-bold mb-3 uppercase tracking-widest">Ends In</Text>
          <View className="flex-row items-center gap-3">
            <View className="bg-card/20 px-4 py-2 rounded-xl backdrop-blur-md">
              <Text className="text-[28px] font-black font-heading text-white">{formatNumber(timeLeft.hours)}</Text>
            </View>
            <Text className="text-white font-bold text-[24px]">:</Text>
            <View className="bg-card/20 px-4 py-2 rounded-xl backdrop-blur-md">
              <Text className="text-[28px] font-black font-heading text-white">{formatNumber(timeLeft.minutes)}</Text>
            </View>
            <Text className="text-white font-bold text-[24px]">:</Text>
            <View className="bg-card/20 px-4 py-2 rounded-xl backdrop-blur-md">
              <Text className="text-[28px] font-black font-heading text-white">{formatNumber(timeLeft.seconds)}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Product List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center p-10">
          <ActivityIndicator size="large" color="#004CFF" />
        </View>
      ) : !sale ? (
        <View className="flex-1 items-center justify-center p-10">
          <Icon name="clock" size={48} color="#cbd5e1" />
          <Text className="text-[16px] font-bold text-muted-foreground mt-4">No active flash sales</Text>
          <Text className="text-[14px] text-muted-foreground mt-1">Check back later for exciting deals!</Text>
        </View>
      ) : (
        <FlatList
        data={items}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }: any) => {
          const claimedPercent = item.quantity > 0 ? Math.round((item.soldCount / item.quantity) * 100) : 0;
          return (
          <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]} 
            className="bg-card rounded-[24px] p-4 flex-row gap-4 mb-4 border border-border shadow-[0_4px_10px_rgba(0,0,0,0.03)]"
            
            onPress={() => router.push(`/(customer)/product/${item.product.id}`)}
          >
            <View className="w-[110px] h-[110px] rounded-[16px] bg-background items-center justify-center overflow-hidden border border-border relative">
              <Icon name="image" size={32} color="#cbd5e1" />
              <View className="absolute top-0 left-0 bg-rose-500 px-2 py-1 rounded-br-[12px] rounded-tl-[16px]">
                <Text className="text-[10px] font-bold text-white uppercase">{item.discountPercent}% OFF</Text>
              </View>
            </View>

            <View className="flex-1 justify-between py-1">
              <View>
                <Text className="text-body-md font-bold text-foreground font-body leading-tight mb-1" numberOfLines={2}>
                  {item.product.name}
                </Text>
                <View className="flex-row items-center gap-2 mb-2">
                  <Text className="text-[18px] font-black text-rose-600 font-heading">
                    GHS {Number(item.discountedPrice).toFixed(2)}
                  </Text>
                  <Text className="text-body-sm text-muted-foreground line-through">
                    GHS {Number(item.product.price).toFixed(2)}
                  </Text>
                </View>
              </View>

              <View>
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-[10px] font-bold text-rose-500 uppercase">{claimedPercent}% Claimed</Text>
                  <Text className="text-[10px] text-muted-foreground font-medium">Limited Stock</Text>
                </View>
                <View className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <View 
                    className="h-full rounded-full" 
                    style={{ 
                      width: `${claimedPercent}%`, 
                      backgroundColor: claimedPercent > 80 ? '#ef4444' : '#f59e0b' 
                    }} 
                  />
                </View>
              </View>
            </View>
          </Pressable>
          );
        }}
      />
      )}
    </View>
  );
}
