import os
import re

def update_file(filepath, replacements, add_import=False):
    if not os.path.exists(filepath):
        print(f"Not found: {filepath}")
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if add_import and 'getUserFriendlyErrorMessage' not in content:
        content = re.sub(r'(import \{ toast \} from \"sonner\";)', r'\1\nimport { getUserFriendlyErrorMessage } from \"@/lib/error-utils\";', content)

    for old, new in replacements:
        content = content.replace(old, new)
        # also try with regex if it's regex
        if old.startswith('^'):
            content = re.sub(old[1:], new, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {filepath}")


update_file('apps/admin/src/app/(auth)/login/page.tsx', [
    ('toast.error(err.response?.data?.message || err.message || "Failed to login");',
     'toast.error(getUserFriendlyErrorMessage(err, "We couldn\'t log you in. Please check your credentials and try again."));'),
    ('toast.error("Please enter a valid 6-digit verification code");',
     'toast.error("Please enter a valid 6-digit code.");'),
    ('toast.error(err.message || "Failed to verify 2FA code");',
     'toast.error(getUserFriendlyErrorMessage(err, "The code you entered didn\'t work. Please request a new one or try again."));')
], True)

update_file('apps/admin/src/app/(dashboard)/admins/page.tsx', [
    ('toast.error("Please fill all fields");',
     'toast.error("Please fill in all the required details.");'),
    ('toast.error(err?.response?.data?.message || "Failed to create admin");',
     'toast.error(getUserFriendlyErrorMessage(err, "We couldn\'t create this admin account right now. Please try again."));')
], True)

update_file('apps/admin/src/app/(dashboard)/dispatchers/[id]/page.tsx', [
    ('toast.error("Failed to update status")',
     'toast.error("We couldn\'t change this dispatcher\'s status. Please try again.")')
])

update_file('apps/admin/src/app/(dashboard)/reports/page.tsx', [
    ('toast.error(Failed to generate  report);',
     'toast.error(We couldn\'t create your  report right now. Please try again in a moment.);')
])

update_file('apps/admin/src/app/(dashboard)/marketing/banners/page.tsx', [
    ('toast.error("Image upload failed");',
     'toast.error("We couldn\'t upload your image. Please ensure it\'s a valid format and try again.");'),
    ('toast.error("Title and image are required");',
     'toast.error("Please provide both a title and an image for your banner.");')
])

update_file('apps/admin/src/app/(dashboard)/marketing/coupons/page.tsx', [
    ('toast.error("Please fill all required fields");',
     'toast.error("Please fill in all the required details to create a coupon.");')
])

update_file('apps/admin/src/app/(dashboard)/marketing/flash-sales/page.tsx', [
    ('toast.error("Please fill all required fields");',
     'toast.error("Please fill in all the required details to create a flash sale.");')
])

update_file('apps/admin/src/app/(dashboard)/moderation/reels/page.tsx', [
    ('toast.error("Failed to update reel status");',
     'toast.error("We couldn\'t update this reel\'s status. Please try again.");')
])

update_file('apps/admin/src/app/(dashboard)/moderation/reviews/page.tsx', [
    ('toast.error("Failed to delete review");',
     'toast.error("We couldn\'t remove this review. Please try again.");')
])
