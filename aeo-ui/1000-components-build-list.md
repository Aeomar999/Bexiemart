# 1000 Components — Personal UI Library Build List

A comprehensive, categorized checklist of components to build into your hybrid system (`ui-web` registry, `ui-native` package, `core` shared logic). Organized into 60 categories, ~1000 total components. Use the checkboxes to track what's built.

## How to use this

- **Rail mapping:** Categories 1–21 and 40–60 are primarily visual/web — build these in `ui-web` first, then port cross-platform ones into `ui-native` as needed. Category 50 (React Native/Mobile-Specific) belongs in `ui-native` from the start. Categories 27–32 (Wallet, Fintech, IoT, Security) carry heavy business logic — build that logic in `core/` first, then thin UI wrappers in `ui-web`/`ui-native`.
- **Priority tiers** (suggested build order, not a hard rule):
  - **Tier 1 — Universal foundation** (build first, used in every project): Categories 1, 5, 6, 7, 8, 9, 10, 11 (~175 components)
  - **Tier 2 — Active project needs**: Marketplace (22–26) and Wallet/Payments (27–28) since BexieMart is your live internship project; Fintech/IoT (29–32) for TellerTill prep
  - **Tier 3 — Build as projects demand**: Booking (33–35), Education (36–39), and everything from 40 onward
- Don't build all 1000 up front — this is a reference menu to pull from as real screens demand them, not a backlog to clear.

---

## 1. Core Primitives (Foundation Layer) — 20
- [ ] **Button** — primary/secondary/ghost/destructive variants
- [ ] **IconButton** — icon-only tap target
- [ ] **Badge** — status/label pill
- [ ] **Avatar** — user/vendor image with fallback initials
- [ ] **Tooltip** — hover/tap contextual hint
- [ ] **Tag** — removable category chip
- [ ] **Divider** — horizontal/vertical rule
- [ ] **Spinner** — inline loading indicator
- [ ] **Progress Bar** — linear percentage indicator
- [ ] **Switch** — on/off toggle
- [ ] **Checkbox** — single/indeterminate state
- [ ] **Radio Group** — single-select option set
- [ ] **Slider** — range value picker
- [ ] **Label** — form field label with required indicator
- [ ] **Chip** — compact selectable token
- [ ] **Skeleton Block** — placeholder shimmer
- [ ] **Card** — base content container
- [ ] **Separator** — labeled section break
- [ ] **Kbd** — keyboard shortcut display
- [ ] **VisuallyHidden** — screen-reader-only text wrapper

## 2. Layout & Structure — 20
- [ ] **Container** — max-width content wrapper
- [ ] **Grid** — responsive column grid
- [ ] **Stack** — vertical spacing wrapper
- [ ] **Cluster** — horizontal wrapping group
- [ ] **Sidebar Shell** — app sidebar layout
- [ ] **Dashboard Shell** — header+sidebar+content layout
- [ ] **Split Pane** — resizable two-panel layout
- [ ] **Sticky Header** — scroll-aware header
- [ ] **Sticky Footer** — pinned bottom bar
- [ ] **Section** — page section with heading
- [ ] **AspectRatio Box** — fixed-ratio media container
- [ ] **Responsive Show/Hide** — breakpoint visibility wrapper
- [ ] **Scroll Area** — custom scrollbar container
- [ ] **Page Header** — title + actions row
- [ ] **Two-Column Layout** — content + rail
- [ ] **Bottom Sheet Shell** — mobile sheet layout
- [ ] **Tabs Shell** — tabbed page layout
- [ ] **Wizard Shell** — multi-step layout frame
- [ ] **Print Layout** — print-optimized wrapper
- [ ] **Empty Shell** — centered empty-state layout

## 3. Navigation — 20
- [ ] **Navbar** — top nav bar
- [ ] **Sidebar Nav** — collapsible vertical nav
- [ ] **Bottom Tab Bar** — mobile tab navigation
- [ ] **Breadcrumbs** — hierarchical path trail
- [ ] **Pagination** — numbered page navigation
- [ ] **Stepper** — linear step indicator
- [ ] **Tabs** — horizontal tab switcher
- [ ] **Dropdown Menu** — nav item with submenu
- [ ] **Mega Menu** — multi-column nav dropdown
- [ ] **Mobile Drawer** — slide-out nav panel
- [ ] **Back Button** — contextual back nav
- [ ] **Floating Action Button** — primary mobile action
- [ ] **Segmented Control** — inline nav toggle
- [ ] **Vertical Stepper** — onboarding progress nav
- [ ] **Anchor Nav** — in-page jump links
- [ ] **Nav Link** — active-state aware link
- [ ] **App Switcher** — multi-app launcher menu
- [ ] **Sticky Sub-nav** — scroll-pinned category nav
- [ ] **Rail Nav** — icon-only collapsed sidebar
- [ ] **Skip Link** — accessibility skip-to-content

## 4. Typography & Content Display — 15
- [ ] **Heading** — semantic h1–h6 wrapper
- [ ] **Prose** — long-form text container
- [ ] **Blockquote** — quoted content block
- [ ] **Code Block** — syntax-highlighted snippet
- [ ] **Inline Code** — monospace inline text
- [ ] **List** — styled ordered/unordered list
- [ ] **Definition List** — term/description pairs
- [ ] **Highlight Text** — marked/emphasized span
- [ ] **Truncated Text** — line-clamp with ellipsis
- [ ] **Read More Toggle** — expandable text block
- [ ] **Markdown Renderer** — rendered markdown content
- [ ] **Callout** — highlighted info box
- [ ] **Stat Text** — large number + label
- [ ] **Label Value Pair** — key-value display row
- [ ] **Copyable Text** — click-to-copy text field

## 5. Form Inputs — 25
- [ ] **Text Input** — single-line text field
- [ ] **Textarea** — multi-line text field
- [ ] **Number Input** — numeric stepper field
- [ ] **Currency Input** — GHS-formatted amount field
- [ ] **Phone Input** — country-code aware phone field
- [ ] **MoMo Number Input** — network auto-detect (MTN/Telecel/AT)
- [ ] **Email Input** — validated email field
- [ ] **Password Input** — masked with visibility toggle
- [ ] **PIN Input** — segmented digit boxes
- [ ] **OTP Input** — auto-advancing code entry
- [ ] **Search Input** — debounced search field
- [ ] **Select** — single-option dropdown
- [ ] **Multi-Select** — tag-based multi-choice
- [ ] **Combobox** — searchable select
- [ ] **Autocomplete** — suggestion-driven input
- [ ] **Date Picker** — calendar date input
- [ ] **Time Picker** — clock time input
- [ ] **Date Range Picker** — start/end date input
- [ ] **File Upload** — drag-and-drop uploader
- [ ] **Image Upload** — preview + crop uploader
- [ ] **Rich Text Editor** — formatted text input
- [ ] **Tag Input** — free-text tag creator
- [ ] **Color Picker** — swatch/hex input
- [ ] **Rating Input** — star/number rating selector
- [ ] **Signature Pad** — draw-to-sign input

## 6. Form Patterns & Composite Forms — 20
- [ ] **Form Field Wrapper** — label+input+error composite
- [ ] **Inline Validation Message** — real-time field feedback
- [ ] **Form Section** — grouped fields with heading
- [ ] **Conditional Field Group** — show/hide logic wrapper
- [ ] **Address Form** — Ghana address fields (region/city/digital address)
- [ ] **Ghana Post GPS Input** — digital address lookup field
- [ ] **Login Form** — email/phone + password
- [ ] **Signup Form** — registration field set
- [ ] **Forgot Password Form** — reset request flow
- [ ] **Profile Edit Form** — account detail editor
- [ ] **Vendor Onboarding Form** — business registration fields
- [ ] **Product Listing Form** — title/price/images/category
- [ ] **Checkout Form** — shipping + payment fields
- [ ] **Contact Form** — name/email/message fields
- [ ] **Feedback Form** — rating + comment fields
- [ ] **Survey Form** — multi-question form renderer
- [ ] **Dynamic Field Array** — repeatable field group (add/remove row)
- [ ] **Form Wizard Controller** — multi-step form state manager
- [ ] **Autosave Form Wrapper** — debounced draft persistence
- [ ] **Form Summary Review** — pre-submit read-only recap

## 7. Buttons & Actions — 15
- [ ] **Loading Button** — spinner-in-button state
- [ ] **Confirm Button** — press-and-hold or double-tap confirm
- [ ] **Copy Button** — copy-to-clipboard action
- [ ] **Share Button** — native share sheet trigger
- [ ] **Download Button** — file download trigger
- [ ] **Toggle Button** — pressed/unpressed state button
- [ ] **Split Button** — primary action + dropdown
- [ ] **Icon + Label Button** — combined icon/text button
- [ ] **Floating Action Menu** — expandable action cluster
- [ ] **Danger Button** — destructive-action styled button
- [ ] **Link Button** — anchor styled as button
- [ ] **Social Auth Button** — Google/Apple sign-in button
- [ ] **Retry Button** — error-state retry action
- [ ] **Bulk Action Bar** — multi-select action toolbar
- [ ] **Sticky CTA Bar** — bottom-pinned call-to-action

## 8. Data Tables & Lists — 20
- [ ] **Data Table** — sortable/filterable table
- [ ] **Virtualized List** — long-list performance renderer
- [ ] **Expandable Row** — nested detail row
- [ ] **Selectable Row** — checkbox row selection
- [ ] **Sticky Header Table** — scroll-pinned column headers
- [ ] **Responsive Table** — mobile card-fallback table
- [ ] **Editable Cell** — inline cell editing
- [ ] **Sortable Column Header** — click-to-sort header
- [ ] **Table Toolbar** — search/filter/export bar
- [ ] **Row Actions Menu** — per-row action dropdown
- [ ] **List Item** — generic list row template
- [ ] **Grouped List** — sectioned list with headers
- [ ] **Draggable List** — reorderable list items
- [ ] **Infinite Scroll List** — auto-loading list
- [ ] **Comparison Table** — side-by-side plan/feature table
- [ ] **Tree View** — nested hierarchical list
- [ ] **Kanban Board** — draggable column board
- [ ] **Timeline List** — chronological event list
- [ ] **Activity Feed** — recent-actions list
- [ ] **Leaderboard List** — ranked score list

## 9. Cards & Content Containers — 20
- [ ] **Product Card** — image/price/vendor listing card
- [ ] **Vendor Card** — shop profile summary card
- [ ] **Order Card** — order status summary card
- [ ] **Wallet Card** — balance + actions card
- [ ] **Stat Card** — KPI number card
- [ ] **Profile Card** — user summary card
- [ ] **Course Card** — Kodi course listing card
- [ ] **Lesson Card** — lesson progress card
- [ ] **Hotel Room Card** — room listing card
- [ ] **Bus Route Card** — TroGo route summary card
- [ ] **Transaction Card** — payment summary card
- [ ] **Notification Card** — alert content card
- [ ] **Testimonial Card** — review/quote card
- [ ] **Pricing Card** — plan comparison card
- [ ] **Feature Card** — icon+text highlight card
- [ ] **Blog Post Card** — article preview card
- [ ] **Event Card** — scheduled event summary
- [ ] **Collapsible Card** — expand/collapse content card
- [ ] **Image Gallery Card** — media grid card
- [ ] **Device Status Card** — IoT hardware status card

## 10. Feedback, Alerts & Overlays — 20
- [ ] **Toast** — transient notification message
- [ ] **Alert Banner** — persistent inline message
- [ ] **Modal** — centered dialog overlay
- [ ] **Drawer** — slide-in side panel
- [ ] **Bottom Sheet** — mobile slide-up panel
- [ ] **Confirmation Dialog** — yes/no action confirm
- [ ] **Alert Dialog** — destructive-action warning
- [ ] **Popover** — anchored contextual panel
- [ ] **Tooltip Overlay** — rich hover overlay
- [ ] **Snackbar** — action-with-undo message
- [ ] **Full-Screen Loader** — blocking load overlay
- [ ] **Success State** — post-action confirmation view
- [ ] **Error State** — failure message + retry
- [ ] **Warning Banner** — non-blocking caution message
- [ ] **Info Banner** — contextual tip message
- [ ] **Lightbox** — fullscreen image/media viewer
- [ ] **Context Menu** — right-click/long-press menu
- [ ] **Onboarding Tour Tooltip** — feature walkthrough step
- [ ] **Cookie/Consent Banner** — privacy notice bar
- [ ] **Maintenance Banner** — service disruption notice

## 11. Loading, Skeleton & Empty States — 15
- [ ] **Skeleton Card** — card-shaped loading placeholder
- [ ] **Skeleton Table Row** — row-shaped loading placeholder
- [ ] **Skeleton Text Lines** — text-shaped loading placeholder
- [ ] **Skeleton Avatar** — circular loading placeholder
- [ ] **Page Loader** — full-page loading state
- [ ] **Inline Spinner** — small loading indicator
- [ ] **Progress Overlay** — upload/download progress screen
- [ ] **Empty State** — no-data illustration + message
- [ ] **Empty Search Results** — no-matches state
- [ ] **Empty Cart** — no-items cart state
- [ ] **Empty Inbox** — no-messages state
- [ ] **First-Time Empty State** — pre-content onboarding prompt
- [ ] **Error Boundary Fallback** — crashed-component fallback UI
- [ ] **Offline State** — no-connection message
- [ ] **Timeout State** — slow-response fallback message

## 12. Data Visualization & Charts — 20
- [ ] **Line Chart** — trend-over-time chart
- [ ] **Bar Chart** — categorical comparison chart
- [ ] **Pie/Donut Chart** — proportion chart
- [ ] **Area Chart** — filled trend chart
- [ ] **Sparkline** — compact inline trend chart
- [ ] **Gauge Chart** — single-value dial chart
- [ ] **Heatmap** — density grid chart
- [ ] **Funnel Chart** — conversion-stage chart
- [ ] **Radar Chart** — multi-axis comparison chart
- [ ] **Candlestick Chart** — OHLC financial chart
- [ ] **Progress Ring** — circular percentage indicator
- [ ] **Stat Comparison** — current-vs-previous metric
- [ ] **Revenue Chart** — sales-over-time chart
- [ ] **Transaction Volume Chart** — MoMo/Paystack volume trend
- [ ] **Chart Legend** — series key component
- [ ] **Chart Tooltip** — hover data reveal
- [ ] **Date Range Selector for Charts** — chart-scoped filter
- [ ] **Dashboard Grid** — arranged chart widget layout
- [ ] **Comparison Bar** — side-by-side metric bars
- [ ] **Trend Indicator** — up/down arrow with % change

## 13. Media & File Display — 15
- [ ] **Image** — lazy-loaded responsive image
- [ ] **Avatar Group** — stacked overlapping avatars
- [ ] **Video Player** — custom-controls video
- [ ] **Audio Player** — waveform/scrubber audio player
- [ ] **Image Carousel** — swipeable image gallery
- [ ] **File Preview** — icon/thumbnail file card
- [ ] **PDF Viewer** — inline document viewer
- [ ] **QR Code Display** — generated QR image
- [ ] **Barcode Display** — generated barcode image
- [ ] **Image Cropper** — crop/resize tool
- [ ] **Gallery Grid** — masonry/grid media layout
- [ ] **Zoomable Image** — pinch/click zoom viewer
- [ ] **Document Thumbnail** — file-type icon preview
- [ ] **Media Uploader Progress** — per-file upload status
- [ ] **Attachment List** — message/order attachment row

## 14. Date, Time & Calendar — 15
- [ ] **Calendar** — month grid view
- [ ] **Mini Calendar** — compact date picker
- [ ] **Event Calendar** — bookings/appointments calendar
- [ ] **Date Range Display** — formatted start-end text
- [ ] **Relative Time** — "2 hours ago" formatter
- [ ] **Countdown Timer** — event countdown display
- [ ] **Duration Picker** — hours/minutes selector
- [ ] **Availability Grid** — time-slot selection grid
- [ ] **Recurring Schedule Picker** — repeat-rule selector
- [ ] **Timezone Selector** — Ghana/GMT-aware picker
- [ ] **Business Hours Display** — open/closed schedule
- [ ] **Booking Slot Picker** — available time slots
- [ ] **Week View Calendar** — 7-day agenda view
- [ ] **Day Agenda** — single-day schedule list
- [ ] **Holiday/Blackout Date Marker** — non-bookable date flag

## 15. Search & Filtering — 15
- [ ] **Search Bar** — global search input
- [ ] **Filter Panel** — sidebar filter controls
- [ ] **Filter Chip Bar** — active-filter tag row
- [ ] **Category Filter** — checkbox category list
- [ ] **Price Range Filter** — min/max slider
- [ ] **Sort Dropdown** — result ordering selector
- [ ] **Search Suggestions** — typeahead suggestion list
- [ ] **Recent Searches** — search history list
- [ ] **No Results Suggestion** — alternative-search prompt
- [ ] **Faceted Search Sidebar** — multi-facet filter UI
- [ ] **Location Filter** — proximity/region filter
- [ ] **Rating Filter** — star-threshold filter
- [ ] **Availability Filter** — in-stock/available toggle
- [ ] **Search Result Highlight** — matched-term emphasis
- [ ] **Voice Search Input** — mic-triggered search field

## 16. Command Palette & Power-User Tools — 10
- [ ] **Command Palette** — Cmd+K global action launcher
- [ ] **Keyboard Shortcut Overlay** — shortcut cheat sheet
- [ ] **Quick Switcher** — fast page/record jump
- [ ] **Recent Items List** — recently viewed records
- [ ] **Bulk Edit Toolbar** — multi-record power actions
- [ ] **Inline Rename** — click-to-edit title
- [ ] **Context-Aware Action Bar** — selection-based toolbar
- [ ] **Slash Command Menu** — inline command trigger
- [ ] **Global Shortcuts Provider** — app-wide hotkey manager
- [ ] **Power Search Syntax Helper** — advanced query hint

## 17. Auth & Onboarding — 20
- [ ] **Login Screen** — email/phone + password auth
- [ ] **Signup Screen** — new account registration
- [ ] **OTP Verification Screen** — code confirmation flow
- [ ] **Forgot Password Screen** — reset request flow
- [ ] **Reset Password Screen** — new password entry
- [ ] **Biometric Prompt** — fingerprint/face unlock UI
- [ ] **Social Login Buttons** — Google/Apple/Facebook auth
- [ ] **Welcome Carousel** — app intro slides
- [ ] **Role Selector** — buyer/vendor/rider selection
- [ ] **Terms & Consent Screen** — agreement acceptance flow
- [ ] **Account Verification Banner** — unverified-account nudge
- [ ] **Session Expired Modal** — re-auth prompt
- [ ] **Device Trust Prompt** — new-device confirmation
- [ ] **Onboarding Checklist** — setup-progress task list
- [ ] **Profile Setup Wizard** — post-signup profile completion
- [ ] **KYC Upload Step** — ID document capture step
- [ ] **Business Verification Step** — vendor registration KYC
- [ ] **PIN Setup Screen** — transaction PIN creation
- [ ] **Security Question Setup** — recovery question form
- [ ] **Logout Confirmation** — sign-out confirm dialog

## 18. User Profile & Account — 15
- [ ] **Profile Header** — avatar/name/bio summary
- [ ] **Account Settings Panel** — editable account fields
- [ ] **Profile Stats** — activity/order count summary
- [ ] **Address Book** — saved addresses list
- [ ] **Payment Methods List** — saved cards/MoMo accounts
- [ ] **Linked Accounts** — connected social/bank accounts
- [ ] **Notification Preferences** — channel toggle list
- [ ] **Privacy Settings** — visibility control toggles
- [ ] **Two-Factor Setup** — 2FA enrollment flow
- [ ] **Session/Device List** — active login sessions
- [ ] **Delete Account Flow** — account closure confirmation
- [ ] **Referral Code Display** — personal invite code card
- [ ] **Achievement Badges** — earned-badge grid
- [ ] **Activity Log** — account action history
- [ ] **Profile Completion Meter** — progress-to-complete indicator

## 19. Notifications & Messaging — 15
- [ ] **Notification Bell** — unread-count icon trigger
- [ ] **Notification List** — dropdown notification feed
- [ ] **Notification Item** — single alert row
- [ ] **In-App Message Banner** — top-of-screen announcement
- [ ] **Push Permission Prompt** — enable-notifications ask
- [ ] **SMS Verification Banner** — phone confirm nudge
- [ ] **Email Digest Preview** — summary email card
- [ ] **Chat Message Bubble** — sent/received message
- [ ] **Message Composer** — text input with send action
- [ ] **Typing Indicator** — "is typing..." animation
- [ ] **Read Receipt** — message-seen indicator
- [ ] **Conversation List** — inbox thread list
- [ ] **Unread Badge** — count indicator dot
- [ ] **Broadcast Announcement** — platform-wide notice card
- [ ] **Do Not Disturb Toggle** — mute-notifications switch

## 20. Chat & AI Assistant Interfaces — 20
- [ ] **AI Chat Window** — full conversation interface
- [ ] **AI Persona Selector** — Kwame/Aisha/Dev picker
- [ ] **AI Message Bubble** — assistant-styled response
- [ ] **Streaming Text Response** — token-by-token render
- [ ] **Code Response Block** — syntax-highlighted AI code output
- [ ] **Suggested Prompts** — quick-start question chips
- [ ] **AI Thinking Indicator** — "thinking..." loading state
- [ ] **Feedback Thumbs** — helpful/unhelpful response rating
- [ ] **Regenerate Response Button** — retry AI answer action
- [ ] **AI Persona Avatar** — instructor character icon
- [ ] **Voice Input Toggle** — mic-to-text for AI chat
- [ ] **Context Panel** — AI-referenced source/file display
- [ ] **Multi-turn History Sidebar** — past AI conversations list
- [ ] **Prompt Input Bar** — chat message composer
- [ ] **AI Explanation Toggle** — "explain this" expandable
- [ ] **Hint Reveal** — progressive hint disclosure (Kodi tutoring)
- [ ] **Code Diff Viewer** — AI-suggested change comparison
- [ ] **AI Confidence Indicator** — certainty/quality signal
- [ ] **Tool-Use Trace** — AI action/step log display
- [ ] **Model Selector** — choose AI instructor difficulty/style

## 21. Multi-Step Wizards & Flows — 10
- [ ] **Step Indicator** — numbered progress dots
- [ ] **Wizard Navigation Footer** — back/next controls
- [ ] **Review & Confirm Step** — final-step summary
- [ ] **Branching Flow Controller** — conditional step logic
- [ ] **Save & Resume Later** — draft-wizard persistence
- [ ] **Progress Percentage Bar** — wizard completion meter
- [ ] **Step Validation Guard** — block-next-until-valid logic
- [ ] **Exit Wizard Confirm** — unsaved-changes warning
- [ ] **Vertical Wizard Sidebar** — step list navigation
- [ ] **Onboarding Wizard Shell** — full setup flow frame

## 22. Marketplace — Product/Listing (BexieMart) — 25
- [ ] **Product Grid** — catalog listing grid
- [ ] **Product Detail View** — full product page
- [ ] **Product Image Gallery** — multi-photo viewer
- [ ] **Product Variant Selector** — size/color options
- [ ] **Product Price Display** — regular/discounted price
- [ ] **Stock Status Badge** — in-stock/low-stock/sold-out tag
- [ ] **Add to Cart Button** — quantity-aware cart action
- [ ] **Wishlist Toggle** — save-for-later heart icon
- [ ] **Product Category Tree** — nested category browser
- [ ] **Related Products Carousel** — cross-sell suggestions
- [ ] **Recently Viewed Products** — browsing history strip
- [ ] **Product Q&A Section** — buyer questions list
- [ ] **Product Reviews List** — rating + comment feed
- [ ] **Bulk Pricing Table** — quantity discount tiers
- [ ] **Product Comparison Grid** — side-by-side spec table
- [ ] **Campus Category Tag** — student-specific listing tag
- [ ] **Seller Verification Badge** — trusted-vendor indicator
- [ ] **Delivery Estimate Display** — expected arrival window
- [ ] **Product Video Preview** — short demo clip
- [ ] **Flash Sale Countdown** — limited-time offer timer
- [ ] **New Arrival Badge** — recently-listed tag
- [ ] **Bundle Deal Card** — multi-item package offer
- [ ] **Product Share Sheet** — social share for listing
- [ ] **Report Listing Button** — flag inappropriate content
- [ ] **Similar Sellers Nearby** — campus-proximity vendor list

## 23. Marketplace — Cart & Checkout (BexieMart) — 20
- [ ] **Cart Drawer** — slide-out cart summary
- [ ] **Cart Item Row** — quantity/remove line item
- [ ] **Cart Summary** — subtotal/fees/total breakdown
- [ ] **Promo Code Input** — discount code field
- [ ] **Delivery Method Selector** — pickup/delivery choice
- [ ] **Campus Pickup Point Picker** — location selection
- [ ] **Checkout Stepper** — cart-to-payment flow
- [ ] **Payment Method Selector** — card/MoMo/wallet choice
- [ ] **Order Confirmation Screen** — post-purchase summary
- [ ] **Order Receipt** — printable/shareable receipt
- [ ] **Split Payment Option** — multi-method payment split
- [ ] **Tip/Service Fee Toggle** — optional add-on charge
- [ ] **Delivery Address Selector** — saved address picker
- [ ] **Order Notes Field** — special-instructions input
- [ ] **Abandoned Cart Reminder** — recover-cart banner
- [ ] **Guest Checkout Toggle** — no-account purchase option
- [ ] **Estimated Delivery Time** — checkout ETA display
- [ ] **Cart Empty State** — no-items cart message
- [ ] **Save Cart for Later** — persistent cart action
- [ ] **Checkout Progress Bar** — steps-remaining indicator

## 24. Marketplace — Vendor Dashboard (BexieMart) — 20
- [ ] **Vendor Overview Dashboard** — sales/orders summary
- [ ] **Sales Chart Widget** — revenue trend graph
- [ ] **Order Queue List** — pending-fulfillment orders
- [ ] **Product Management Table** — editable listing table
- [ ] **Bulk Product Upload** — CSV/Excel import tool
- [ ] **Vendor Payout Summary** — earnings/withdrawal overview
- [ ] **Withdrawal Request Form** — payout initiation form
- [ ] **Vendor Rating Overview** — aggregate review score
- [ ] **Store Customization Panel** — shop branding editor
- [ ] **Promotions Manager** — discount/campaign creator
- [ ] **Low Stock Alert List** — restock reminder list
- [ ] **Order Status Updater** — fulfillment status control
- [ ] **Customer Message Inbox** — buyer inquiry list
- [ ] **Vendor Analytics Report** — performance export view
- [ ] **Store Hours Editor** — availability schedule setter
- [ ] **Return/Refund Request Queue** — dispute handling list
- [ ] **Product Performance Table** — per-item sales stats
- [ ] **Vendor Onboarding Progress** — setup checklist
- [ ] **Multi-Vendor Team Access** — staff permission manager
- [ ] **Vendor Announcement Composer** — buyer-facing update post

## 25. Marketplace — Inventory Management — 15
- [ ] **Inventory Table** — stock-level overview
- [ ] **Stock Adjustment Form** — manual quantity edit
- [ ] **Low Stock Threshold Setter** — reorder-point config
- [ ] **SKU Generator Field** — auto-generated product code
- [ ] **Variant Stock Matrix** — size/color stock grid
- [ ] **Inventory History Log** — stock-change audit trail
- [ ] **Barcode Scanner Input** — scan-to-update stock
- [ ] **Supplier List** — vendor-source management
- [ ] **Purchase Order Form** — restock order creation
- [ ] **Inventory Import Wizard** — bulk stock upload
- [ ] **Stock Transfer Form** — inter-location move
- [ ] **Expiry Date Tracker** — perishable-item alert list
- [ ] **Inventory Valuation Summary** — stock-worth report
- [ ] **Damaged/Returned Stock Log** — write-off tracking
- [ ] **Inventory Forecast Widget** — reorder prediction chart

## 26. Marketplace — Order & Delivery Logistics — 15
- [ ] **Order Tracking Timeline** — status-progress stepper
- [ ] **Delivery Map View** — live rider location map
- [ ] **Rider Assignment Panel** — dispatch-to-rider control
- [ ] **Delivery Proof Upload** — photo/signature confirmation
- [ ] **Order Status Badge** — pending/shipped/delivered tag
- [ ] **Delivery Route Optimizer Display** — planned stop sequence
- [ ] **Rider Profile Card** — courier info + rating
- [ ] **ETA Countdown** — live delivery time estimate
- [ ] **Delivery Fee Calculator** — distance-based fee display
- [ ] **Failed Delivery Reason Form** — redelivery/refund reason
- [ ] **Multi-Stop Delivery List** — batched order sequence
- [ ] **Delivery Zone Map** — coverage-area visualization
- [ ] **Return Pickup Scheduler** — reverse-logistics booking
- [ ] **Contactless Delivery Toggle** — no-contact preference
- [ ] **Delivery Rating Prompt** — post-delivery feedback ask

## 27. Wallet & Payments — Core (MoMo/Paystack/GhiPSS) — 25
- [ ] **Wallet Balance Display** — current balance card
- [ ] **Top-Up Form** — add-funds flow (MoMo/card)
- [ ] **Withdraw Form** — cash-out flow
- [ ] **Internal Transfer Form** — wallet-to-wallet send
- [ ] **Payment Method Card** — saved card/MoMo tile
- [ ] **Add Payment Method Flow** — new method registration
- [ ] **Network Auto-Detect Badge** — MTN/Telecel/AT indicator
- [ ] **Paystack Checkout Embed** — hosted payment widget
- [ ] **Transaction PIN Prompt** — payment authorization step
- [ ] **Payment Processing State** — pending-transaction loader
- [ ] **Payment Success Screen** — confirmation with receipt
- [ ] **Payment Failed Screen** — retry/error explanation
- [ ] **GhiPSS Transfer Form** — interbank transfer flow
- [ ] **Bank Account Link Form** — external account linking
- [ ] **QR Pay Scanner** — scan-to-pay interface
- [ ] **Merchant Pay Screen** — vendor payment confirmation
- [ ] **Recurring Payment Setup** — subscription/auto-debit form
- [ ] **Currency Display** — GHS-formatted amount
- [ ] **Exchange Rate Display** — multi-currency conversion (diaspora)
- [ ] **Split Bill Form** — group-payment divider
- [ ] **Request Money Form** — payment request composer
- [ ] **Payment Limit Indicator** — daily/transaction limit display
- [ ] **Fee Breakdown Tooltip** — transaction fee transparency
- [ ] **Escrow Status Card** — held-funds indicator
- [ ] **Wallet Freeze Notice** — restricted-account banner

## 28. Wallet & Payments — Transaction History & Statements — 15
- [ ] **Transaction List** — chronological payment history
- [ ] **Transaction Detail View** — single-transaction breakdown
- [ ] **Statement Generator** — monthly statement export
- [ ] **Transaction Filter Bar** — type/date/status filter
- [ ] **Transaction Search** — reference/amount search
- [ ] **Transaction Category Tags** — spend-categorization chips
- [ ] **Spending Summary Chart** — category breakdown chart
- [ ] **Transaction Receipt Download** — PDF receipt export
- [ ] **Dispute Transaction Button** — flag-for-review action
- [ ] **Recurring Transaction List** — subscriptions overview
- [ ] **Pending Transactions List** — awaiting-confirmation queue
- [ ] **Reversed Transaction Badge** — refund/reversal indicator
- [ ] **Transaction Export (CSV/Excel)** — bulk data download
- [ ] **Monthly Spend Trend** — statement comparison chart
- [ ] **Transaction Reference Copy** — copyable transaction ID

## 29. Fintech Dashboard (TellerTill) — 25
- [ ] **Cash Position Overview** — real-time till balance
- [ ] **Multi-Terminal Dashboard** — all-devices summary view
- [ ] **Reconciliation Table** — expected-vs-actual cash log
- [ ] **Float Management Panel** — starting-cash allocation
- [ ] **Cash Drawer Log** — open/close event history
- [ ] **Teller Session Summary** — shift performance card
- [ ] **Denomination Breakdown Table** — note/coin count grid
- [ ] **Cash Variance Alert** — over/short discrepancy flag
- [ ] **End-of-Day Report** — shift-close summary export
- [ ] **Multi-Branch Comparison View** — location performance table
- [ ] **Transaction Volume Dashboard** — throughput metrics view
- [ ] **Compliance Audit Log** — regulatory action trail
- [ ] **Teller Performance Leaderboard** — staff ranking view
- [ ] **Cash-in-Transit Tracker** — vault-to-branch movement log
- [ ] **Till Limit Threshold Alert** — max-cash warning
- [ ] **Deposit Slip Generator** — bank-deposit form
- [ ] **Cash Order Request Form** — replenishment request
- [ ] **Real-Time Alert Feed** — anomaly/fraud notification stream
- [ ] **Regulatory Report Export** — Bank of Ghana compliance file
- [ ] **User Role Permission Matrix** — staff access control table
- [ ] **Terminal Health Status** — device-online indicator
- [ ] **Cash Forecast Chart** — predicted cash-need trend
- [ ] **Multi-Currency Till View** — foreign note handling
- [ ] **Shift Handover Form** — outgoing/incoming teller signoff
- [ ] **Fraud Flag Review Panel** — suspicious-transaction queue

## 30. IoT / Hardware Device Monitoring (TellerTill) — 20
- [ ] **Device Status Grid** — fleet-wide online/offline view
- [ ] **Device Detail Panel** — single-unit diagnostics
- [ ] **Firmware Update Manager** — OTA update controls
- [ ] **MQTT Connection Indicator** — live broker connection status
- [ ] **Sensor Reading Chart** — live telemetry graph
- [ ] **Device Battery/Power Status** — power-source indicator
- [ ] **Device Location Map** — geo-tagged device map
- [ ] **Alert Rule Builder** — threshold-based alert config
- [ ] **Device Log Viewer** — raw event/command log
- [ ] **Remote Command Panel** — send-command-to-device UI
- [ ] **Device Health Score** — composite status indicator
- [ ] **Connectivity History Chart** — uptime/downtime timeline
- [ ] **Device Registration Form** — new-hardware provisioning
- [ ] **Firmware Version Table** — fleet version compliance view
- [ ] **Tamper Alert Badge** — physical-security event flag
- [ ] **Cash Counter Hardware Status** — note-counting module state
- [ ] **Device Group Manager** — fleet segmentation tool
- [ ] **Bandwidth Usage Monitor** — data-consumption chart
- [ ] **Device Command Queue** — pending-command list
- [ ] **Offline Device Alert List** — unreachable-device queue

## 31. Cash Handling / POS Hardware UI (TellerTill) — 15
- [ ] **Note Counting Result Display** — counted-cash breakdown
- [ ] **Coin Sorting Result Display** — counted-coin breakdown
- [ ] **Counterfeit Detection Alert** — flagged-note warning
- [ ] **Cash Deposit Confirmation Screen** — machine-deposit receipt
- [ ] **Receipt Printer Status** — printer-ready/error indicator
- [ ] **Cash Recycler Status Panel** — dispense/accept module state
- [ ] **Till Session Start Screen** — shift-open confirmation
- [ ] **Till Session Close Screen** — shift-close confirmation
- [ ] **Manual Override Panel** — supervisor-override controls
- [ ] **Hardware Error Code Display** — diagnostic error card
- [ ] **Cash Cassette Level Indicator** — note-stock fill gauge
- [ ] **Device Self-Test Screen** — startup diagnostic view
- [ ] **Dual-Control Approval Prompt** — two-person authorization
- [ ] **Vault Access Log** — secure-access event history
- [ ] **Maintenance Mode Banner** — device-in-service notice

## 32. Security, KYC & Verification — 15
- [ ] **ID Document Upload** — Ghana Card/passport capture
- [ ] **Selfie Liveness Check** — face-match capture step
- [ ] **KYC Status Badge** — verified/pending/rejected tag
- [ ] **Document Review Panel** — admin verification screen
- [ ] **Verification Progress Tracker** — multi-step KYC status
- [ ] **Fraud Risk Score Display** — transaction risk indicator
- [ ] **Two-Factor Auth Prompt** — code-entry security step
- [ ] **Suspicious Activity Alert** — account-security warning
- [ ] **Login History List** — access-log security view
- [ ] **Device Trust Manager** — recognized-devices list
- [ ] **Data Privacy Consent Toggle** — GDPR/data-use control
- [ ] **Account Lock Notice** — security-hold banner
- [ ] **AML Watchlist Flag** — compliance screening indicator
- [ ] **Business Registration Verifier** — vendor legal-doc check
- [ ] **Biometric Enrollment Screen** — fingerprint/face setup

## 33. Booking & Reservations Core (TroGo/StayPortal) — 20
- [ ] **Availability Calendar** — bookable-date grid
- [ ] **Booking Summary Card** — reservation recap
- [ ] **Guest/Passenger Count Selector** — party-size input
- [ ] **Booking Confirmation Screen** — post-booking receipt
- [ ] **Cancellation Policy Display** — refund-rule text block
- [ ] **Booking Modify Flow** — change-reservation form
- [ ] **Booking Reference Lookup** — find-by-code search
- [ ] **Price Breakdown Panel** — fees/taxes itemization
- [ ] **Booking Status Timeline** — confirmed/pending/completed steps
- [ ] **Reminder Notification Card** — upcoming-booking alert
- [ ] **Cancel Booking Confirmation** — cancellation confirm dialog
- [ ] **Rebooking Suggestion** — similar-option recommendation
- [ ] **Group Booking Form** — multi-party reservation
- [ ] **Booking History List** — past-reservations list
- [ ] **E-Ticket/Voucher Display** — digital confirmation pass
- [ ] **Add-On Selector** — extras/upsell checklist
- [ ] **Booking Countdown** — time-until-departure/check-in
- [ ] **Waitlist Join Form** — sold-out standby request
- [ ] **Booking Terms Checkbox** — policy-acceptance step
- [ ] **Multi-Leg Itinerary View** — connected-booking summary

## 34. Transport / Bus Booking Specific (TroGo) — 15
- [ ] **Route Search Form** — origin/destination picker
- [ ] **Bus Schedule List** — departure-time list
- [ ] **Seat Map Selector** — interactive seat picker
- [ ] **Bus Operator Card** — company info + rating
- [ ] **Trip Duration Display** — estimated travel time
- [ ] **Boarding Point Selector** — pickup-location picker
- [ ] **Terminal/Station Info Card** — location + amenities
- [ ] **Ticket QR Display** — boarding-pass QR code
- [ ] **Live Bus Tracking Map** — real-time vehicle location
- [ ] **Fare Comparison Table** — operator price comparison
- [ ] **Luggage Policy Display** — baggage-allowance info
- [ ] **Trip Delay Alert** — schedule-change notification
- [ ] **Round-Trip Toggle** — one-way/return selector
- [ ] **Frequent Route Shortcut** — saved-route quick-book
- [ ] **Driver/Vehicle Info Card** — assigned-vehicle details

## 35. Hospitality / Hotel Management (StayPortal) — 20
- [ ] **Room Type Card** — room category listing
- [ ] **Room Availability Grid** — date-by-room matrix
- [ ] **Rate Plan Selector** — pricing-tier picker
- [ ] **Guest Check-In Form** — arrival registration
- [ ] **Guest Check-Out Form** — departure processing
- [ ] **Housekeeping Status Board** — room-clean-status grid
- [ ] **Room Service Order Form** — in-room order request
- [ ] **Amenity Icon List** — hotel-feature icon row
- [ ] **Front Desk Dashboard** — daily arrivals/departures view
- [ ] **Guest Folio View** — itemized stay charges
- [ ] **Room Assignment Panel** — reservation-to-room mapping
- [ ] **Maintenance Request Form** — room-issue reporting
- [ ] **Occupancy Rate Widget** — real-time occupancy chart
- [ ] **Guest Loyalty Tier Badge** — membership-level indicator
- [ ] **Property Photo Gallery** — room/facility image grid
- [ ] **Group Reservation Manager** — block-booking control
- [ ] **Night Audit Report** — end-of-day hotel report
- [ ] **Guest Preference Notes** — special-request tracker
- [ ] **Concierge Request Panel** — guest-services request queue
- [ ] **Multi-Property Switcher** — chain-management selector

## 36. Education — Course & Curriculum (Kodi) — 20
- [ ] **Course Catalog Grid** — browsable course listing
- [ ] **Course Detail Page** — syllabus/overview view
- [ ] **Curriculum Roadmap** — module-sequence visualization
- [ ] **Module Accordion** — expandable lesson grouping
- [ ] **Lesson List** — ordered lesson items
- [ ] **Course Progress Bar** — completion-percentage indicator
- [ ] **Prerequisite Checker** — required-course validator
- [ ] **Course Rating Summary** — aggregate student feedback
- [ ] **Instructor Bio Card** — course-creator profile
- [ ] **Course Preview Player** — free-sample lesson viewer
- [ ] **Enrollment Button** — join-course action
- [ ] **Course Pricing Card** — MoMo micro-payment tier
- [ ] **Certificate Preview** — completion-award display
- [ ] **Learning Path Selector** — track/specialization picker
- [ ] **Course Bundle Card** — multi-course package
- [ ] **Syllabus PDF Export** — downloadable course outline
- [ ] **Course Discussion Forum** — student Q&A thread
- [ ] **Course Announcement Feed** — instructor updates
- [ ] **Skill Tag List** — course topic/skill chips
- [ ] **Course Difficulty Badge** — beginner/intermediate/advanced tag

## 37. Education — Learning & Progress (Kodi) — 20
- [ ] **Lesson Player** — video/content lesson view
- [ ] **Progress Tracker Sidebar** — module-completion overview
- [ ] **Streak Counter** — daily-learning-streak display
- [ ] **XP/Points Display** — gamified score indicator
- [ ] **Quiz Component** — multiple-choice question set
- [ ] **Code Challenge Component** — in-browser coding exercise
- [ ] **Auto-Grading Result** — pass/fail feedback panel
- [ ] **Hint System** — progressive-hint reveal
- [ ] **Bookmark Lesson Button** — save-for-later marker
- [ ] **Note-Taking Panel** — inline lesson notes
- [ ] **Resume Learning Card** — continue-where-left-off prompt
- [ ] **Completion Certificate** — downloadable award
- [ ] **Skill Assessment Test** — placement/level test
- [ ] **Peer Project Showcase** — student-work gallery
- [ ] **Study Reminder Notification** — scheduled-practice nudge
- [ ] **Learning Calendar Heatmap** — activity-density view
- [ ] **Time Spent Tracker** — study-duration summary
- [ ] **Weak Areas Report** — performance-gap analysis
- [ ] **Practice Set Generator** — adaptive exercise list
- [ ] **Graduation/Milestone Modal** — achievement celebration

## 38. Education — Coding/IDE Specific (Kodi) — 20
- [ ] **In-Browser Code Editor** — Monaco/CodeMirror wrapper
- [ ] **Live Preview Pane** — rendered-output viewer
- [ ] **Console Output Panel** — execution log display
- [ ] **File Tree Sidebar** — project file navigator
- [ ] **Terminal Emulator Panel** — in-browser shell
- [ ] **Run/Submit Button** — execute-code action
- [ ] **Test Results Panel** — pass/fail test breakdown
- [ ] **Syntax Error Highlighter** — inline error markers
- [ ] **Code Diff Reviewer** — before/after comparison
- [ ] **Split Editor/Preview Layout** — resizable code+output view
- [ ] **Language Selector** — runtime/language picker
- [ ] **AI Code Suggestion Inline** — ghost-text completion
- [ ] **Debugger Step Panel** — breakpoint/step controls
- [ ] **Package/Dependency Manager UI** — install-package panel
- [ ] **Version History Panel** — code-snapshot timeline
- [ ] **Collaborative Cursor Indicator** — multiplayer editing marker
- [ ] **Code Snippet Library** — reusable-snippet picker
- [ ] **Exercise Instructions Panel** — task-description sidebar
- [ ] **Auto-Save Indicator** — draft-save status
- [ ] **Keyboard Shortcut Helper** — editor-shortcut reference

## 39. Education — AI Instructor Personas (Kodi) — 10
- [ ] **Persona Introduction Card** — Kwame/Aisha/Dev bio intro
- [ ] **Persona Switch Confirmation** — change-instructor prompt
- [ ] **Persona Teaching Style Badge** — tone/approach indicator
- [ ] **Persona Chat Header** — active-instructor identifier
- [ ] **Persona Feedback Style Selector** — strict/encouraging toggle
- [ ] **Persona Voice Toggle** — text/voice response switch
- [ ] **Persona Recommendation Banner** — suggested-instructor match
- [ ] **Persona Mood/Expression Indicator** — animated reaction state
- [ ] **Persona Session Summary** — end-of-session recap
- [ ] **Persona Unlock Notice** — new-instructor-available alert

## 40. Gamification & Motivation — 15
- [ ] **Achievement Badge Grid** — earned-badges display
- [ ] **Leaderboard Widget** — ranked-users list
- [ ] **XP Progress Bar** — level-up meter
- [ ] **Streak Flame Indicator** — consecutive-days visual
- [ ] **Daily Challenge Card** — task-of-the-day prompt
- [ ] **Reward Unlock Modal** — new-reward celebration
- [ ] **Level-Up Animation Trigger** — milestone celebration
- [ ] **Badge Detail Popover** — achievement description
- [ ] **Referral Reward Tracker** — invite-progress display
- [ ] **Milestone Timeline** — progress-history visualization
- [ ] **Point Redemption Store** — rewards-catalog grid
- [ ] **Team Challenge Board** — group-competition view
- [ ] **Weekly Recap Card** — progress-summary share card
- [ ] **Confetti/Celebration Overlay** — success micro-animation
- [ ] **Motivational Quote Card** — encouragement message tile

## 41. Admin Dashboard & Analytics — 20
- [ ] **Admin Overview Dashboard** — platform-wide KPI summary
- [ ] **User Management Table** — account list with actions
- [ ] **Role & Permission Editor** — access-control matrix
- [ ] **Revenue Analytics Chart** — platform-earnings trend
- [ ] **User Growth Chart** — signups-over-time graph
- [ ] **Content Moderation Queue** — flagged-content review list
- [ ] **System Health Dashboard** — uptime/error monitoring
- [ ] **Audit Log Viewer** — admin-action history
- [ ] **Feature Flag Manager** — toggle-based rollout control
- [ ] **Bulk User Actions Toolbar** — mass-account operations
- [ ] **Support Ticket Queue** — admin helpdesk view
- [ ] **Platform Announcement Composer** — system-wide notice creator
- [ ] **Data Export Panel** — report/CSV generation
- [ ] **API Usage Dashboard** — request-volume monitoring
- [ ] **Error Log Explorer** — exception-tracking view
- [ ] **Vendor Approval Queue** — new-seller review list
- [ ] **Dispute Resolution Panel** — buyer/seller conflict manager
- [ ] **Cohort Retention Chart** — user-retention analysis
- [ ] **Funnel Analysis Chart** — conversion-drop-off view
- [ ] **Custom Report Builder** — configurable analytics query UI

## 42. Settings & Configuration — 15
- [ ] **Settings Layout Shell** — categorized settings page
- [ ] **Notification Settings Panel** — channel/frequency controls
- [ ] **Theme Settings** — light/dark/system selector
- [ ] **Language Settings** — locale/i18n selector
- [ ] **Privacy Settings Panel** — data-sharing toggles
- [ ] **Account Security Settings** — password/2FA controls
- [ ] **Billing Settings Panel** — payment-method management
- [ ] **API Key Manager** — developer-key generation
- [ ] **Webhook Configuration Panel** — integration endpoint setup
- [ ] **Team Member Settings** — collaborator management
- [ ] **Data Export/Import Settings** — account-data controls
- [ ] **Integration Connections Panel** — third-party linked apps
- [ ] **Default Preferences Form** — app-wide default settings
- [ ] **Accessibility Settings Panel** — font-size/contrast controls
- [ ] **Danger Zone Panel** — irreversible-action section

## 43. Pricing & Billing — 15
- [ ] **Pricing Table** — plan-comparison grid
- [ ] **Plan Toggle** — monthly/annual switch
- [ ] **Invoice List** — billing-history table
- [ ] **Invoice Detail View** — itemized-charge breakdown
- [ ] **Payment Method Manager** — saved billing methods
- [ ] **Usage Meter** — plan-limit consumption display
- [ ] **Upgrade/Downgrade Prompt** — plan-change flow
- [ ] **Trial Countdown Banner** — remaining-trial-days notice
- [ ] **Discount Code Field** — billing coupon input
- [ ] **Tax Breakdown Display** — VAT/levy itemization
- [ ] **Billing Contact Form** — invoice-recipient details
- [ ] **Failed Payment Banner** — payment-retry prompt
- [ ] **Proration Notice** — mid-cycle charge explanation
- [ ] **Subscription Cancellation Flow** — plan-cancel confirmation
- [ ] **Receipt/Invoice PDF Export** — downloadable billing doc

## 44. Reviews, Ratings & Feedback — 10
- [ ] **Star Rating Display** — average-score visual
- [ ] **Review Card** — written-review with rating
- [ ] **Review Submission Form** — rate + comment input
- [ ] **Rating Distribution Bar** — 1-5 star breakdown chart
- [ ] **Verified Purchase Badge** — confirmed-buyer tag
- [ ] **Helpful Vote Button** — upvote-review action
- [ ] **Review Reply** — vendor-response thread
- [ ] **Review Filter Bar** — rating/date filter controls
- [ ] **NPS Survey Widget** — likelihood-to-recommend prompt
- [ ] **Feedback Thank You Screen** — post-submission confirmation

## 45. Maps & Location (Ghana-specific) — 15
- [ ] **Map View** — interactive location map
- [ ] **Ghana Post GPS Lookup** — digital address search
- [ ] **Region/District Selector** — Ghana administrative picker
- [ ] **Nearby Vendors Map** — proximity-based vendor pins
- [ ] **Delivery Zone Overlay** — coverage-area map layer
- [ ] **Location Pin Drop** — manual location selection
- [ ] **Current Location Button** — GPS-locate action
- [ ] **Distance Calculator Display** — km/time-away indicator
- [ ] **Landmark-Based Address Input** — "near X" description field
- [ ] **Route Preview Map** — planned-path visualization
- [ ] **Cluster Marker** — grouped-pin map indicator
- [ ] **Map Search Bar** — location-search overlay
- [ ] **Geofence Alert Indicator** — zone-entry/exit notice
- [ ] **Static Map Thumbnail** — lightweight location preview
- [ ] **Multi-Stop Route Map** — delivery/trip stop sequence

## 46. File & Document Handling — 15
- [ ] **File Manager Grid** — browsable file/folder view
- [ ] **Document Preview Modal** — inline file viewer
- [ ] **Drag-and-Drop Upload Zone** — multi-file drop target
- [ ] **File Type Icon Set** — extension-based icons
- [ ] **Upload Progress List** — multi-file progress tracker
- [ ] **File Version History** — revision timeline
- [ ] **Shared File List** — collaborator-access file view
- [ ] **Document Signature Request** — e-sign workflow trigger
- [ ] **Bulk File Download** — zip-export action
- [ ] **File Permission Manager** — access-level control
- [ ] **Scan-to-Upload** — camera-capture document input
- [ ] **Document Category Tags** — file-classification chips
- [ ] **Storage Usage Meter** — quota-consumption display
- [ ] **File Search Bar** — filename/content search
- [ ] **Trash/Recently Deleted View** — recoverable-files list

## 47. Localization & Ghana-Specific Utilities — 15
- [ ] **GHS Currency Formatter** — cedi-formatted display
- [ ] **Network Provider Badge** — MTN/Telecel/AT indicator
- [ ] **Ghana Card Number Input** — national-ID formatted field
- [ ] **Digital Address Validator** — Ghana Post format check
- [ ] **Region/City Cascading Selector** — location dropdown chain
- [ ] **Twi/Ga/Ewe Language Toggle** — local-language switch
- [ ] **Public Holiday Banner** — Ghana holiday notice
- [ ] **Low-Bandwidth Mode Toggle** — data-saver switch
- [ ] **USSD Fallback Prompt** — feature-phone alternative notice
- [ ] **Local Business Hours Format** — Ghana time-convention display
- [ ] **Data Bundle Cost Estimator** — expected-data-use notice
- [ ] **Offline-First Sync Indicator** — pending-sync status
- [ ] **SMS-Based Verification Fallback** — no-data-required OTP
- [ ] **Regional Price Variation Tag** — location-based pricing note
- [ ] **Currency Exchange Notice** — diaspora-remittance rate display

## 48. Accessibility & Inclusive Design — 15
- [ ] **Skip to Content Link** — keyboard-first navigation aid
- [ ] **Focus Ring Wrapper** — visible-focus-state component
- [ ] **High Contrast Mode Toggle** — visibility-enhancing switch
- [ ] **Font Size Adjuster** — text-scaling control
- [ ] **Screen Reader Announcer** — live-region status updates
- [ ] **Reduced Motion Toggle** — animation-disable switch
- [ ] **Alt Text Manager** — image-description editor
- [ ] **Keyboard Navigation Indicator** — tab-order visual aid
- [ ] **Color-Blind Safe Palette Toggle** — accessible-color mode
- [ ] **Voice-Over Friendly Labels** — ARIA-labeled component set
- [ ] **Large Tap Target Wrapper** — touch-accessibility spacer
- [ ] **Captions/Subtitles Toggle** — media-accessibility control
- [ ] **Simplified Language Mode** — plain-language content toggle
- [ ] **Low-Literacy Icon Mode** — icon-heavy simplified UI
- [ ] **Accessible Error Summary** — form-error screen-reader list

## 49. Animation & Motion Wrappers — 15
- [ ] **Fade Transition Wrapper** — enter/exit fade animation
- [ ] **Slide Transition Wrapper** — directional slide animation
- [ ] **Scale Pop Wrapper** — emphasis scale animation
- [ ] **Stagger List Animation** — sequential item reveal
- [ ] **Page Transition Wrapper** — route-change animation
- [ ] **Skeleton Shimmer Effect** — loading-state shimmer
- [ ] **Confetti Burst Effect** — celebration animation
- [ ] **Parallax Scroll Wrapper** — depth-scroll effect
- [ ] **Hover Lift Effect** — card-hover elevation
- [ ] **Loading Dots Animation** — typing/processing indicator
- [ ] **Number Counter Animation** — animated stat count-up
- [ ] **Success Checkmark Animation** — completed-action animation
- [ ] **Pull-to-Refresh Animation** — mobile refresh gesture feedback
- [ ] **Micro-Interaction Button Press** — tactile press feedback
- [ ] **Scroll-Triggered Reveal** — in-view fade/slide animation

## 50. React Native / Mobile-Specific — 25
- [ ] **Native Tab Bar** — platform-styled bottom nav
- [ ] **Swipeable Row** — swipe-to-delete/action list row
- [ ] **Pull-to-Refresh Wrapper** — native refresh gesture
- [ ] **Native Bottom Sheet** — gesture-driven sheet
- [ ] **Native Action Sheet** — iOS/Android action menu
- [ ] **Native Camera Capture** — photo/document capture screen
- [ ] **Native Biometric Prompt** — Face ID/fingerprint unlock
- [ ] **Native Share Sheet Trigger** — platform share intent
- [ ] **Native Push Permission Prompt** — OS notification request
- [ ] **Native Haptic Feedback Wrapper** — vibration-on-action
- [ ] **Native Keyboard Avoiding View** — input-focus scroll adjust
- [ ] **Native Deep Link Handler** — app-link routing component
- [ ] **Native Splash Screen** — app-launch loading screen
- [ ] **Native Status Bar Controller** — style/color manager
- [ ] **Native Gesture Handler Card** — swipe/drag interactive card
- [ ] **Native Image Picker** — gallery/camera source picker
- [ ] **Native Toast** — platform-styled transient message
- [ ] **Native Segmented Control** — iOS-style tab switch
- [ ] **Native Modal Presentation** — platform-appropriate modal
- [ ] **Native Offline Banner** — connectivity-loss indicator
- [ ] **Native App Update Prompt** — force/soft update notice
- [ ] **Native Contact Picker** — device-contacts selector
- [ ] **Native Location Permission Prompt** — GPS-access request
- [ ] **Native QR/Barcode Scanner** — camera-based scan view
- [ ] **Native Home Screen Widget Preview** — OS widget mockup component

## 51. Offline, Sync & Low-Bandwidth (Ghana context) — 15
- [ ] **Offline Indicator Banner** — no-connection status bar
- [ ] **Sync Status Icon** — pending/synced/error indicator
- [ ] **Queued Actions List** — offline-action-pending queue
- [ ] **Conflict Resolution Modal** — sync-conflict merge prompt
- [ ] **Data Saver Mode Toggle** — reduced-image/data switch
- [ ] **Cached Content Badge** — offline-available indicator
- [ ] **Background Sync Progress** — silent-sync status display
- [ ] **Low-Data Image Placeholder** — text-first media fallback
- [ ] **Retry Queue Manager** — failed-request retry list
- [ ] **Offline Form Draft Saver** — local-storage draft persistence
- [ ] **Network Speed Indicator** — connection-quality badge
- [ ] **Lite Mode Toggle** — stripped-down UI switch
- [ ] **Download for Offline Button** — save-content-locally action
- [ ] **Sync Now Button** — manual-refresh trigger
- [ ] **Last Synced Timestamp** — data-freshness indicator

## 52. Social & Community Features — 15
- [ ] **Follow/Unfollow Button** — social-connection toggle
- [ ] **User Feed** — activity/post stream
- [ ] **Comment Thread** — nested-reply comment section
- [ ] **Like/Reaction Button** — engagement-action control
- [ ] **Share to Social Button** — external-platform share
- [ ] **Community Forum List** — topic/thread browser
- [ ] **Direct Message Inbox** — peer-to-peer chat list
- [ ] **Group/Community Card** — community summary tile
- [ ] **Mention Autocomplete** — @username suggestion input
- [ ] **Poll/Voting Component** — community-poll widget
- [ ] **User-Generated Content Gallery** — community-post grid
- [ ] **Report User/Content Flow** — abuse-reporting form
- [ ] **Block User Confirmation** — user-block action dialog
- [ ] **Community Guidelines Banner** — rules-reminder notice
- [ ] **Trending Topics List** — popular-discussion widget

## 53. Customer Support & Helpdesk — 15
- [ ] **Support Chat Widget** — floating help-chat launcher
- [ ] **FAQ Accordion** — expandable question list
- [ ] **Help Center Search** — knowledge-base search bar
- [ ] **Ticket Submission Form** — support-request creator
- [ ] **Ticket Status Tracker** — open/pending/resolved indicator
- [ ] **Live Agent Handoff Prompt** — bot-to-human transfer
- [ ] **Contact Options Panel** — email/phone/chat choices
- [ ] **Satisfaction Survey (CSAT)** — post-support rating
- [ ] **Article Feedback Widget** — helpful/not-helpful vote
- [ ] **Callback Request Form** — schedule-a-call flow
- [ ] **Support Ticket History** — past-tickets list
- [ ] **Known Issues Banner** — active-incident notice
- [ ] **Troubleshooting Wizard** — guided-diagnosis flow
- [ ] **Escalation Request Button** — priority-support action
- [ ] **Self-Service Resource Grid** — help-article categories

## 54. Referral & Growth — 15
- [ ] **Referral Link Generator** — shareable-invite link card
- [ ] **Referral Progress Tracker** — invites-to-reward meter
- [ ] **Invite Friends Form** — email/contact invite composer
- [ ] **Referral Leaderboard** — top-referrers list
- [ ] **Share Incentive Banner** — reward-for-share prompt
- [ ] **Waitlist Signup Form** — early-access request
- [ ] **Waitlist Position Display** — queue-rank indicator
- [ ] **App Store Review Prompt** — rate-the-app nudge
- [ ] **Social Proof Counter** — "X users joined" widget
- [ ] **Growth Milestone Banner** — user-count celebration
- [ ] **Loyalty Tier Progress** — spend-to-tier meter
- [ ] **Cashback Offer Card** — referral-reward incentive
- [ ] **Invite Code Redemption Field** — enter-referral-code input
- [ ] **Growth Loop CTA Banner** — share-to-unlock prompt
- [ ] **Testimonial Submission Form** — user-story collection

## 55. Landing Page & Marketing Sections — 15
- [ ] **Hero Section** — headline + CTA banner
- [ ] **Feature Grid Section** — icon+text feature highlights
- [ ] **Social Proof Logo Bar** — trusted-by logo strip
- [ ] **Testimonial Carousel Section** — rotating customer quotes
- [ ] **Pricing Section** — plan-comparison landing block
- [ ] **FAQ Section** — common-questions landing block
- [ ] **CTA Banner Section** — conversion-focused call-out
- [ ] **How It Works Section** — numbered-steps explainer
- [ ] **Footer** — links/legal/social footer block
- [ ] **Newsletter Signup Section** — email-capture block
- [ ] **Comparison Section** — us-vs-competitor block
- [ ] **Stats/Numbers Section** — impressive-metric showcase
- [ ] **Team/About Section** — company-intro block
- [ ] **App Download Section** — App/Play Store badges block
- [ ] **Waitlist/Coming Soon Section** — pre-launch capture block

## 56. Subscription & Membership Management — 10
- [ ] **Subscription Status Card** — active-plan summary
- [ ] **Plan Change Confirmation** — upgrade/downgrade dialog
- [ ] **Auto-Renewal Toggle** — recurring-billing control
- [ ] **Membership Benefits List** — plan-perks breakdown
- [ ] **Grace Period Banner** — payment-failed retention notice
- [ ] **Cancellation Reason Form** — churn-survey prompt
- [ ] **Win-Back Offer Card** — re-subscribe incentive
- [ ] **Family/Team Plan Manager** — multi-seat allocation
- [ ] **Free Trial Signup Form** — trial-activation flow
- [ ] **Subscription Pause Option** — temporary-hold control

## 57. Dark Mode / Theming Utilities — 10
- [ ] **Theme Toggle Switch** — light/dark/system control
- [ ] **Theme Provider Wrapper** — app-wide theme context
- [ ] **Color Token Preview** — design-token swatch grid
- [ ] **Brand Theme Customizer** — vendor-store color picker
- [ ] **Contrast Checker Widget** — accessibility color validator
- [ ] **Font Pairing Selector** — typography-theme picker
- [ ] **Component Theme Preview** — live-theme component gallery
- [ ] **Seasonal Theme Switcher** — promotional theme toggle
- [ ] **Custom CSS Variable Editor** — advanced theme override
- [ ] **Theme Persistence Indicator** — saved-preference confirmation

## 58. Developer & Testing Utility Components — 10
- [ ] **Storybook Story Wrapper** — isolated-component preview
- [ ] **Mock Data Provider** — fixture/seed data wrapper
- [ ] **Feature Flag Debug Panel** — dev-only flag overrides
- [ ] **API Response Inspector** — dev-mode request/response viewer
- [ ] **Component Playground** — prop-editable live preview
- [ ] **Design Token Debugger** — token-usage inspector
- [ ] **Performance Overlay** — render-time/FPS monitor
- [ ] **Accessibility Audit Overlay** — a11y-issue highlighter
- [ ] **Grid/Baseline Overlay** — layout-alignment guide
- [ ] **Environment Banner** — dev/staging/prod indicator

## 59. Print / Export / PDF-Specific — 10
- [ ] **Printable Invoice Layout** — print-optimized invoice
- [ ] **Printable Receipt Layout** — print-optimized receipt
- [ ] **Export to PDF Button** — document-generation trigger
- [ ] **Export to Excel Button** — spreadsheet-generation trigger
- [ ] **Print Preview Modal** — pre-print layout check
- [ ] **Report Cover Page** — branded export title page
- [ ] **Watermark Overlay** — draft/confidential stamp
- [ ] **Multi-Page Print Layout** — paginated print content
- [ ] **QR Code Print Tag** — scannable print label
- [ ] **Signature Line Block** — printable sign-here field

## 60. Error Handling & Edge Cases — 10
- [ ] **404 Not Found Page** — missing-page state
- [ ] **500 Server Error Page** — server-failure state
- [ ] **Network Error Banner** — connectivity-failure notice
- [ ] **Permission Denied Screen** — access-restricted state
- [ ] **Rate Limit Warning** — too-many-requests notice
- [ ] **Session Timeout Screen** — expired-session state
- [ ] **Maintenance Mode Page** — scheduled-downtime state
- [ ] **Unsupported Browser Banner** — compatibility warning
- [ ] **Form Submission Error Summary** — validation-failure recap
- [ ] **Graceful Degradation Fallback** — reduced-functionality notice

---

**Total: 1000 components across 60 categories.**

Realistic path: don't build these in order. Pull from Tier 1 as you touch real screens, add Marketplace/Wallet components as BexieMart demands them, and treat categories 29–32 as a side benefit of your TellerTill interview prep — build the UI shells even before you have the backend, since visualizing the domain is part of what'll make you sound sharp in that interview.
