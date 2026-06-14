import os
import re

TARGET_DIRS = [
    r"c:\Users\Jerry\Desktop\Bexiemart\apps\mobile\src",
    r"c:\Users\Jerry\Desktop\Bexiemart\apps\mobile\app"
]

# We need precise regex ordering. It evaluates top to bottom, so longer strings should go first if needed.
# Since it's a dictionary, insertion order matters in Python 3.7+
REPLACEMENTS = {
    # Typography
    r"\btext-\[32px\]\b": "text-display-lg",
    r"\btext-\[28px\]\b": "text-display-md",
    r"\btext-\[24px\]\b": "text-display-md",
    r"\btext-\[22px\]\b": "text-display-sm",
    r"\btext-\[20px\]\b": "text-display-sm",
    r"\btext-\[18px\]\b": "text-heading-md",
    r"\btext-\[16px\]\b": "text-body-lg", 
    r"\btext-\[15px\]\b": "text-body-lg",
    r"\btext-\[14px\]\b": "text-body-md",
    r"\btext-\[13px\]\b": "text-sm",
    r"\btext-\[12px\]\b": "text-body-sm",
    r"\btext-\[11px\]\b": "text-caption",
    # Leave 10px alone or maybe use text-caption
    r"\btext-\[10px\]\b": "text-caption",
    r"\btext-\[9px\]\b": "text-caption",

    # Radius
    r"\brounded-\[4px\]\b": "rounded-sm",
    r"\brounded-\[6px\]\b": "rounded-md",
    r"\brounded-\[8px\]\b": "rounded-md",
    r"\brounded-\[12px\]\b": "rounded-lg",
    r"\brounded-\[16px\]\b": "rounded-xl",
    r"\brounded-\[20px\]\b": "rounded-2xl",
    r"\brounded-\[24px\]\b": "rounded-2xl",
    r"\brounded-\[32px\]\b": "rounded-3xl",
    r"\brounded-t-\[24px\]\b": "rounded-t-2xl",
    r"\brounded-t-\[32px\]\b": "rounded-t-3xl",
    r"\brounded-b-\[24px\]\b": "rounded-b-2xl",
    r"\brounded-b-\[32px\]\b": "rounded-b-3xl",

    # Widths & Heights
    r"\bw-\[24px\]\b": "w-6",
    r"\bh-\[24px\]\b": "h-6",
    r"\bw-\[32px\]\b": "w-8",
    r"\bh-\[32px\]\b": "h-8",
    r"\bw-\[40px\]\b": "w-10",
    r"\bh-\[40px\]\b": "h-10",
    r"\bw-\[48px\]\b": "w-12",
    r"\bh-\[48px\]\b": "h-12",
    r"\bw-\[56px\]\b": "w-14",
    r"\bh-\[56px\]\b": "h-14",
    r"\bw-\[64px\]\b": "w-16",
    r"\bh-\[64px\]\b": "h-16",
    r"\bw-\[72px\]\b": "w-18",
    r"\bh-\[72px\]\b": "h-18",
    
    r"\bh-\[52px\]\b": "h-[52px]", # Will leave unique ones alone or manually handle. Better to leave 52px as it's not standard 10, 12, 14. Wait, let's map 52px to 14 (56px) or 12 (48px)? Let's leave custom ones.
    
    # Padding and Margin
    r"\bp-\[16px\]\b": "p-4",
    r"\bp-\[20px\]\b": "p-5",
    r"\bp-\[24px\]\b": "p-6",
    r"\bpt-\[16px\]\b": "pt-4",
    r"\bpb-\[16px\]\b": "pb-4",
    r"\bpl-\[16px\]\b": "pl-4",
    r"\bpr-\[16px\]\b": "pr-4",
    r"\bm-\[16px\]\b": "m-4",
    r"\bmt-\[16px\]\b": "mt-4",
    r"\bmb-\[16px\]\b": "mb-4",
    r"\bmt-\[24px\]\b": "mt-6",
    r"\bmb-\[24px\]\b": "mb-6",
    
    # Gap
    r"\bgap-\[8px\]\b": "gap-2",
    r"\bgap-\[12px\]\b": "gap-3",
    r"\bgap-\[16px\]\b": "gap-4",
    r"\bgap-\[20px\]\b": "gap-5",
    r"\bgap-\[24px\]\b": "gap-6",
    
    # Colors
    r"\bbg-\[#10b981\]\b": "bg-success",
    r"\btext-\[#10b981\]\b": "text-success",
    r"\bbg-\[#ef4444\]\b": "bg-error",
    r"\btext-\[#ef4444\]\b": "text-error",
    r"\bbg-rose-500\b": "bg-error",
    r"\btext-rose-600\b": "text-error",
    r"\btext-red-600\b": "text-error",
    r"\btext-green-700\b": "text-success",
    r"\bbg-slate-900\b": "bg-surface-900",
    
    # Drop shadows 
    r"\bshadow-\[0_4px_12px_rgba\([^\]]+\)\]\b": "shadow-md",
    r"\bshadow-\[0_10px_20px_rgba\([^\]]+\)\]\b": "shadow-lg",
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
