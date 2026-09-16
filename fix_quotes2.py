import os

count = 0
for root, dirs, files in os.walk('apps/'):
    if 'node_modules' in dirs:
        dirs.remove('node_modules')
    if '.next' in dirs:
        dirs.remove('.next')
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            if r'\"' in content:
                content = content.replace(r'\"', '"')
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                count += 1
print(f'Fixed {count} files')
