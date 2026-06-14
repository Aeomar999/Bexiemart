import os
import re

TARGET_DIRS = [
    r"c:\Users\Jerry\Desktop\Bexiemart\apps\mobile\src",
    r"c:\Users\Jerry\Desktop\Bexiemart\apps\mobile\app"
]

REPLACEMENTS = {
    # Brand (Blue) -> Primary
    r"\bbg-brand-500\b": "bg-primary",
    r"\bbg-brand-600\b": "bg-primary",
    r"\bbg-brand-700\b": "bg-primary-hover",
    r"\bbg-brand-800\b": "bg-primary-hover",
    r"\bbg-brand-900\b": "bg-primary-hover",
    r"\bbg-brand-50\b": "bg-primary-subtle",
    r"\bbg-brand-100\b": "bg-primary-subtle",
    r"\bbg-brand-200\b": "bg-primary-subtle",
    r"\bbg-brand-300\b": "bg-primary-subtle",
    r"\bbg-brand-400\b": "bg-primary-subtle",
    r"\btext-brand-500\b": "text-primary",
    r"\btext-brand-600\b": "text-primary",
    r"\btext-brand-700\b": "text-primary-hover",
    r"\btext-brand-800\b": "text-foreground",
    r"\btext-brand-900\b": "text-foreground",
    r"\bborder-brand-500\b": "border-primary",
    r"\bborder-l-brand-500\b": "border-l-primary",
    r"\bborder-brand-600\b": "border-primary",
    r"\bborder-brand-700\b": "border-primary-hover",
    r"\bborder-brand-100\b": "border-border",
    r"\bborder-brand-200\b": "border-border",
    r"\bborder-brand-300\b": "border-border",
    r"\bshadow-brand-[0-9]{3}/[0-9]{2}\b": "shadow-none",
    r"#004CFF\b": "var(--color-primary)",
    r"#3366FF\b": "var(--color-primary)",
    
    # Accent -> Secondary
    r"\bbg-accent-500\b": "bg-secondary",
    r"\bbg-accent-600\b": "bg-secondary",
    r"\bbg-accent\b": "bg-secondary",
    r"\btext-accent-500\b": "text-secondary",
    r"\btext-accent-600\b": "text-secondary",
    r"\btext-accent\b": "text-secondary",
    r"\bborder-accent-500\b": "border-secondary",
    r"\bborder-accent-600\b": "border-secondary",
    r"\bshadow-accent-[0-9]{3}/[0-9]{2}\b": "shadow-none",
    
    # Surface -> Structural
    r"\bbg-surface-50\b": "bg-background",
    r"\bbg-surface-100\b": "bg-muted",
    r"\bbg-surface-200\b": "bg-muted",
    r"\bbg-surface-700\b": "bg-background",
    r"\bbg-surface-800\b": "bg-background",
    r"\bbg-surface-900\b": "bg-background",
    r"\bborder-surface-100\b": "border-border",
    r"\bborder-surface-200\b": "border-border",
    r"\bborder-surface-300\b": "border-border",
    r"\bborder-surface-700/50\b": "border-border",
    r"\bborder-surface-800\b": "border-border",
    r"\bborder-surface-900\b": "border-border", 
    r"\btext-surface-900\b": "text-foreground",
    r"\btext-surface-800\b": "text-foreground",
    r"\btext-surface-700\b": "text-muted-foreground",
    r"\btext-surface-600\b": "text-muted-foreground",
    r"\btext-surface-500\b": "text-muted-foreground",
    r"\btext-surface-400\b": "text-muted-foreground",
    r"\bshadow-surface-200/50\b": "shadow-sm",
}

def migrate_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    for pattern, repl in REPLACEMENTS.items():
        new_content = re.sub(pattern, repl, new_content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

def main():
    changed_files = 0
    for target_dir in TARGET_DIRS:
        for root, dirs, files in os.walk(target_dir):
            for file in files:
                if file.endswith(('.tsx', '.ts')):
                    filepath = os.path.join(root, file)
                    if migrate_file(filepath):
                        changed_files += 1
                        print(f"Updated: {filepath}")

    print(f"\nMigration complete. Updated {changed_files} files.")

if __name__ == "__main__":
    main()
