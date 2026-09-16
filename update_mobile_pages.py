import os
import re

def update_file(filepath, replacements, add_import=False):
    if not os.path.exists(filepath):
        # Find if it is somewhere else
        # Because we might be wrong about exact path
        import glob
        matches = glob.glob(f"apps/mobile/**/{os.path.basename(filepath)}", recursive=True)
        if matches:
            filepath = matches[0]
        else:
            print(f"Not found: {filepath}")
            return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if add_import and 'getUserFriendlyErrorMessage' not in content:
        content = re.sub(r'(import .* from ".*";)', r'\1\nimport { getUserFriendlyErrorMessage } from "@/lib/error-utils";', content, count=1)

    for old, new in replacements:
        if isinstance(old, str):
            if old.startswith('^'):
                content = re.sub(old[1:], new, content)
            else:
                content = content.replace(old, new)
        else:
            content = old.sub(new, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {filepath}")


update_file('apps/mobile/app/(customer)/become-dispatcher.tsx', [
    ('text1: "Missing Fields", text2: "Please fill all the details."',
     'text1: "Almost there!", text2: "Please fill in all the required fields to continue."')
])

update_file('apps/mobile/app/(dispatcher)/(tabs)/(home)/index.tsx', [
    ('text1: "Failed to update online status"',
     'text1: "We couldn\'t update your online status. Please check your connection."'),
    ('text1: "Failed to update location"',
     'text1: "We\'re having trouble updating your location. Please check your GPS settings."'),
    ('text1: "Unable to open phone app"',
     'text1: "We couldn\'t open your phone\'s dialer. Please try calling manually."')
])

update_file('apps/mobile/app/(dispatcher)/(tabs)/(earnings)/withdraw.tsx', [
    ('title: "No account", message: "Add a payout account first."',
     'title: "Where should we send your money?", message: "Please add a payout account first."')
])
update_file('apps/mobile/app/(vendor)/(earnings)/withdraw.tsx', [
    ('title: "No account", message: "Add a payout account first."',
     'title: "Where should we send your money?", message: "Please add a payout account first."')
])

update_file('apps/mobile/app/(customer)/(tabs)/cart.tsx', [
    ('text1: "Enter Code", text2: "Please enter a coupon code."',
     'text1: "Oops!", text2: "You forgot to enter a coupon code."'),
    ('text1: "Invalid", text2: "Coupon code not recognized."',
     'text1: "Invalid Code", text2: "We didn\'t recognize that coupon code. Please check it and try again."')
])

update_file('apps/mobile/src/components/screens/EditProfileScreen.tsx', [
    ('text1: "Missing Fields", text2: "Name and Email are required."',
     'text1: "Almost there!", text2: "Please provide both your name and email address to save changes."')
])

update_file('apps/mobile/app/(customer)/contact.tsx', [
    ('text1: "Email failed", text2: "No email app available"',
     'text1: "Email failed", text2: "We couldn\'t open your email app. You can reach us at support@bexiemart.com."'),
    ('text1: "Call failed", text2: "No phone app available"',
     'text1: "Call failed", text2: "We couldn\'t open your phone\'s dialer. Please try calling manually."')
])

update_file('apps/mobile/app/(customer)/food-cart.tsx', [
    ('title: "Location Error",\n        message: "Could not fetch your current location."',
     'title: "Location Error",\n        message: "We couldn\'t find your exact location. Please check your device settings or enter it manually."'),
    ('title: "Order Failed",\n          message: "Could not place your order. Please try again."',
     'title: "Order Failed",\n          message: "We couldn\'t place your order right now. Don\'t worry, you haven\'t been charged. Please try again."')
])

update_file('apps/mobile/app/(customer)/referrals.tsx', [
    ('text1: "Error", text2: "Could not generate referral code."',
     'text1: "Oops!", text2: "We couldn\'t create your referral code right now. Please try again later."')
])

update_file('apps/mobile/app/(customer)/review-modal.tsx', [
    ('text1: "Missing Product",\n        text2: "Cannot submit review without a product."',
     'text1: "Something went wrong",\n        text2: "We couldn\'t find the product to review."'),
    ('text1: "Submission Failed", text2: "Please try again."',
     'text1: "Submission Failed", text2: "We couldn\'t post your review. Please try again."')
])

update_file('apps/mobile/app/(customer)/track-order.tsx', [
    ('title: "Could not cancel",\n        message: "The ride may be in progress."',
     'title: "Could not cancel",\n        message: "We couldn\'t cancel this request. It might already be on the way."'),
    ('text1: "Unable to open phone app"',
     'text1: "We couldn\'t open your phone\'s dialer. Please try calling manually."')
])

update_file('apps/mobile/app/(vendor)/add-reel.tsx', [
    ('message: e?.message ?? "Try a shorter clip."',
     'message: getUserFriendlyErrorMessage(e, "We couldn\'t upload your video. Please ensure it\'s a supported format and try again.")'),
    ('title: "Product Required",\n        message: "Tag a product to make this reel shoppable."',
     'title: "Product Required",\n        message: "Please tag at least one product so shoppers can buy from your reel."')
], True)

update_file('apps/mobile/app/(customer)/checkout.tsx', [
    ('text2: err?.message ?? "Something went wrong."',
     'text2: getUserFriendlyErrorMessage(err, "We hit a snag placing your order. Please try again.")'),
    ('You need 1000 coins. You have .',
     'You need 1,000 BexieCoins to use this. You currently have .')
], True)

update_file('apps/mobile/app/(customer)/payment.tsx', [
    ('text1: "Missing Fields",\n        text2: "Please fill out all required fields."',
     'text1: "Almost there!",\n        text2: "Please fill out all required fields."')
])
