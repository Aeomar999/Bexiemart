# coding=utf-8
import io
import re

path = r"apps/mobile/app/(customer)/wallet/cards/index.tsx"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(
    r'<LinearGradient\s+colors=\{\["transparent", "rgba\(249, 250, 251, 0\.8\)", "#F9FAFB"\]\}\s+locations=\{\[0, 0\.4, 1\]\}\s+style=\{\{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, paddingTop: 40 \}\}\s*>',
    '<View className="absolute bottom-0 left-0 right-0 px-5 pt-4 pb-8 bg-background border-t border-border">',
    content
)

content = content.replace('</LinearGradient>', '</View>')

# Also remove the import
content = re.sub(r'import \{ LinearGradient \} from "expo-linear-gradient";\n?', '', content)

with io.open(path, "w", encoding="utf-8") as f:
    f.write(content)
