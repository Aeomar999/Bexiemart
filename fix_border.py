import os
f = 'apps/mobile/app/(customer)/wallet/index.tsx'
with open(f, 'r', encoding='utf-8') as file:
    content = file.read()
content = content.replace('justify-center border"', 'justify-center"')
with open(f, 'w', encoding='utf-8') as file:
    file.write(content)
