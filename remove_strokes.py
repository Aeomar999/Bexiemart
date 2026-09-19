import os
import re

files_to_update = [
    'apps/mobile/app/(customer)/wallet/index.tsx',
    'apps/mobile/app/(vendor)/(earnings)/index.tsx',
    'apps/mobile/app/(dispatcher)/(tabs)/(earnings)/index.tsx',
    'apps/mobile/app/(dispatcher)/(tabs)/(earnings)/analytics.tsx',
    'apps/mobile/app/(customer)/(tabs)/cart.tsx',
]

def process_file(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    
    # Remove inline React Native borders
    content = re.sub(r'\s*borderTopWidth:\s*[\d\.]+,?', '', content)
    content = re.sub(r'\s*borderColor:\s*["\'][^"\']+["\'],?', '', content)
    
    # Remove Tailwind borders on money heroes (black/5, white/20, border-t, border-r)
    content = content.replace(' border-white/20', '')
    content = content.replace(' border-black/5', '')
    content = content.replace('border border-black/5', '')
    
    content = content.replace(' border-t ', ' ')
    content = content.replace(' border-r ', ' ')

    # Specific cleanups for the gradient buttons in wallet index
    content = content.replace('rounded-full border"', 'rounded-full"')
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for f in files_to_update:
    process_file(f)
