import os
import re

directories = ['apps/mobile', 'apps/admin']
exclude_dirs = {'node_modules', '.next', '.expo', 'dist', 'build', '.git'}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    
    # 1. Remove Tailwind classes
    # match shadow classes but avoid breaking class names
    content = re.sub(r'\b(?:hover:)?(?:drop-)?shadow(?:-[a-zA-Z0-9\-]+)?\b', '', content)
    
    # Clean up empty className
    content = re.sub(r'className=""', '', content)
    content = re.sub(r'className=" "', '', content)
    
    # 2. Remove React Native styles
    content = re.sub(r'\s*shadowColor:\s*["\'][^"\']+["\'],?', '', content)
    content = re.sub(r'\s*shadowOffset:\s*\{[^}]+\},?', '', content)
    content = re.sub(r'\s*shadowOpacity:\s*[^,\n]+,?', '', content)
    content = re.sub(r'\s*shadowRadius:\s*[^,\n]+,?', '', content)
    
    # Remove elevation if <= 100
    content = re.sub(r'\s*elevation:\s*(?:[1-9][0-9]?|100)\b,?', '', content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for d in directories:
    for root, dirs, files in os.walk(d):
        dirs[:] = [dir_name for dir_name in dirs if dir_name not in exclude_dirs]
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts') or file.endswith('.jsx') or file.endswith('.js'):
                process_file(os.path.join(root, file))
