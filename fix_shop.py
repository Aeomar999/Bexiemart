# coding=utf-8
import io

path = r"apps/mobile/app/(customer)/(tabs)/(shop)/index.tsx"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace Search Bar
search_old = '''          <View className="px-5 flex-row items-center gap-3">
            <View className="flex-1 flex-row items-center gap-2 bg-muted rounded-2xl px-4 h-11">
              <Icon name="search" size={16} color={tokens.textMuted} />
              <TextInput
                className="flex-1 font-body text-body-sm text-foreground"
                placeholder="Search products"'''
search_new = '''          <View className="px-5 flex-row items-center gap-3">
            <View className="flex-1 flex-row items-center gap-2 bg-background rounded-xl px-4 h-12 border border-border">
              <Icon name="search" size={18} color={tokens.textMuted} />
              <TextInput
                className="flex-1 font-body text-body-lg text-foreground"
                placeholder="Search products"'''
content = content.replace(search_old, search_new)


# Replace Category FlashList
flashlist_old = '''          <FlashList<{ id: string; name: string }>
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            keyExtractor={(item) => item.id}
            className="mt-5"
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className={`px-4 h-[36px] justify-center items-center rounded-full ${
                  activeCategoryFilter === item.name ? "bg-primary" : "bg-muted"
                }`}
                onPress={() => setActiveCategoryFilter(item.name)}
              >
                <Text
                  className={`text-body-sm font-bold ${
                    activeCategoryFilter === item.name ? "text-white" : "text-muted-foreground"
                  }`}
                >
                  {item.name}
                </Text>
              </Pressable>
            )}
          />'''

flashlist_new = '''          <FlashList<{ id: string; name: string }>
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            keyExtractor={(item) => item.id}
            className="mt-5"
            contentContainerStyle={{ paddingHorizontal: 20 }}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className={`px-4 py-2 justify-center items-center rounded-full border ${
                  activeCategoryFilter === item.name ? "bg-foreground border-border" : "bg-card border-border"
                }`}
                onPress={() => setActiveCategoryFilter(item.name)}
              >
                <Text
                  className={`text-[14px] font-bold ${
                    activeCategoryFilter === item.name ? "text-white" : "text-muted-foreground"
                  }`}
                >
                  {item.name}
                </Text>
              </Pressable>
            )}
          />'''

content = content.replace(flashlist_old, flashlist_new)

with io.open(path, "w", encoding="utf-8") as f:
    f.write(content)
