import os
import re

hooks_dir = 'apps/admin/src/lib/hooks'

for file in os.listdir(hooks_dir):
    if file.endswith('.ts') and file != 'use-realtime.ts':
        path = os.path.join(hooks_dir, file)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Add import
        if 'getUserFriendlyErrorMessage' not in content:
            content = re.sub(r'(import \{ toast \} from \"sonner\";)', r'\1\nimport { getUserFriendlyErrorMessage } from \"@/lib/error-utils\";', content)
        
        def replacer(match):
            fallback = match.group(1)
            friendly = fallback
            if 'banner' in fallback.lower(): friendly = 'We couldn\'t save this banner. Please check your connection and try again.'
            elif 'coupon' in fallback.lower(): friendly = 'We couldn\'t create the coupon. Please double-check the details.'
            elif 'dispute' in fallback.lower(): friendly = 'We couldn\'t close this dispute. Please try again.'
            elif 'order' in fallback.lower(): friendly = 'We couldn\'t update the order status. Please refresh and try again.'
            elif 'profile' in fallback.lower(): friendly = 'We couldn\'t save your profile changes. Please try again.'
            elif 'password' in fallback.lower(): friendly = 'We couldn\'t update your password. Please try again.'
            elif 'avatar' in fallback.lower(): friendly = 'Your photo couldn\'t be uploaded. Please try a smaller image file.'
            elif 'role' in fallback.lower(): friendly = 'We couldn\'t change this user\'s role. Please try again.'
            elif 'vendor' in fallback.lower(): friendly = 'We couldn\'t update this vendor\'s account status. Please try again.'
            elif 'settings' in fallback.lower(): friendly = 'Your changes couldn\'t be saved. Please try again.'
            return 'toast.error(getUserFriendlyErrorMessage(error, \"' + friendly + '\"))'

        content = re.sub(r'toast\.error\(\s*error\?\.response\?\.data\?\.message\s*\|\|\s*\"([^\"]+)\"\s*\)', replacer, content)
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
print('Done admin hooks')
