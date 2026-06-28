import os
import re

TARGET_DIRS = [
    r"c:\Users\Jerry\Desktop\Bexiemart\apps\mobile\src",
    r"c:\Users\Jerry\Desktop\Bexiemart\apps\mobile\app"
]

# Removed the trailing \b because ] is a non-word character, making \b fail if followed by space or quote.
# Also removed leading \b for safety. We can rely on space or quote boundary, or just trust the string.
# Using lookarounds to ensure we don't partially match, e.g. (?<=[ "\']) prefix and (?=[ "\']) suffix.

REPLACEMENTS = {
    # Typography
    r"text-\[32px\]": "text-display-lg",
    r"text-\[28px\]": "text-display-md",
    r"text-\[24px\]": "text-display-md",
    r"text-\[22px\]": "text-display-sm",
    r"text-\[20px\]": "text-display-sm",
    r"text-\[18px\]": "text-heading-md",
    r"text-\[16px\]": "text-body-lg", 
    r"text-\[15px\]": "text-body-lg",
    r"text-\[14px\]": "text-body-md",
    r"text-\[13px\]": "text-sm",
    r"text-\[12px\]": "text-body-sm",
    r"text-\[11px\]": "text-caption",
    r"text-\[10px\]": "text-caption",
    r"text-\[9px\]": "text-caption",

    # Radius
    r"rounded-\[4px\]": "rounded-sm",
    r"rounded-\[6px\]": "rounded-md",
    r"rounded-\[8px\]": "rounded-md",
    r"rounded-\[12px\]": "rounded-lg",
    r"rounded-\[16px\]": "rounded-xl",
    r"rounded-\[20px\]": "rounded-2xl",
    r"rounded-\[24px\]": "rounded-2xl",
    r"rounded-\[32px\]": "rounded-3xl",
    r"rounded-t-\[24px\]": "rounded-t-2xl",
    r"rounded-t-\[32px\]": "rounded-t-3xl",
    r"rounded-b-\[24px\]": "rounded-b-2xl",
    r"rounded-b-\[32px\]": "rounded-b-3xl",

    # Widths & Heights
    r"w-\[22px\]": "w-[22px]", # keep custom
    r"w-\[24px\]": "w-6",
    r"h-\[24px\]": "h-6",
    r"w-\[32px\]": "w-8",
    r"h-\[32px\]": "h-8",
    r"w-\[40px\]": "w-10",
    r"h-\[40px\]": "h-10",
    r"w-\[48px\]": "w-12",
    r"h-\[48px\]": "h-12",
    r"w-\[56px\]": "w-14",
    r"h-\[56px\]": "h-14",
    r"w-\[64px\]": "w-16",
    r"h-\[64px\]": "h-16",
    r"w-\[72px\]": "w-18",
    r"h-\[72px\]": "h-18",
    
    # Padding and Margin
    r"p-\[16px\]": "p-4",
    r"p-\[20px\]": "p-5",
    r"p-\[24px\]": "p-6",
    r"pt-\[16px\]": "pt-4",
    r"pb-\[16px\]": "pb-4",
    r"pl-\[16px\]": "pl-4",
    r"pr-\[16px\]": "pr-4",
    r"m-\[16px\]": "m-4",
    r"mt-\[16px\]": "mt-4",
    r"mb-\[16px\]": "mb-4",
    r"mt-\[24px\]": "mt-6",
    r"mb-\[24px\]": "mb-6",
    
    # Gap
    r"gap-\[8px\]": "gap-2",
    r"gap-\[12px\]": "gap-3",
    r"gap-\[16px\]": "gap-4",
    r"gap-\[20px\]": "gap-5",
    r"gap-\[24px\]": "gap-6",
    
    # Colors
    r"bg-\[#10b981\]": "bg-success",
    r"text-\[#10b981\]": "text-success",
    r"bg-\[#ef4444\]": "bg-error",
    r"text-\[#ef4444\]": "text-error",
    r"bg-rose-500": "bg-error",
    r"text-rose-600": "text-error",
    r"text-red-600": "text-error",
    r"text-green-700": "text-success",
    r"bg-slate-900": "bg-surface-900",
    
    # Drop shadows 
    r"shadow-\[0_4px_12px_rgba\([^\]]+\)\]": "shadow-md",
    r"shadow-\[0_10px_20px_rgba\([^\]]+\)\]": "shadow-lg",
}

def migrate_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    for pattern, repl in REPLACEMENTS.items():
        # Use negative lookbehind and lookahead to ensure we don't replace inside a larger word, 
        # but allow punctuation like quotes or spaces.
        regex = r"(?<![A-Za-z0-9-])" + pattern + r"(?![A-Za-z0-9-])"
        new_content = re.sub(regex, repl, new_content)

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
