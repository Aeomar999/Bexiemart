import os
import glob
files = glob.glob('apps/admin/**/*.ts', recursive=True) + glob.glob('apps/admin/**/*.tsx', recursive=True)
files += glob.glob('apps/mobile/**/*.ts', recursive=True) + glob.glob('apps/mobile/**/*.tsx', recursive=True)
count = 0
for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    if r'\"' in content:
        content = content.replace(r'\"', '"')
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        count += 1
print(f'Fixed {count} files')
