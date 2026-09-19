# coding=utf-8
import io
import re

path = r"apps/mobile/app/(customer)/wallet/cards/index.tsx"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix FlatList padding
content = content.replace('contentContainerStyle={{ padding: 20, paddingBottom: 100 }}', 'contentContainerStyle={{ padding: 20, paddingBottom: 120 }}')

# Fix Add button wrapper
old_gradient = '''        {/* Floating Add Button */}
        <LinearGradient
          colors={["transparent", "rgba(249, 250, 251, 0.8)", "#F9FAFB"]}
          locations={[0, 0.4, 1]}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, paddingTop: 40 }}
        >'''

new_view = '''        {/* Floating Add Button */}
        <View
          className="absolute bottom-0 left-0 right-0 px-5 pt-4 pb-8 bg-background border-t border-border"
        >'''

content = content.replace(old_gradient, new_view)

old_gradient_close = '''          </Pressable>
        </LinearGradient>'''
new_view_close = '''          </Pressable>
        </View>'''

content = content.replace(old_gradient_close, new_view_close)

with io.open(path, "w", encoding="utf-8") as f:
    f.write(content)
