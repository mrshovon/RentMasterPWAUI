// =============================================================================
// Bangla (বাংলা) translations. THE ENGLISH TEXT IS THE KEY — see lib/i18n.tsx.
//
// Anything missing here renders its English key verbatim, so this file can grow without ever
// breaking the UI. That also means a typo in a key is invisible: it silently falls back to
// English rather than erroring, so keys must match the source string EXACTLY (punctuation,
// capitalisation, and the — em dashes and ’ curly apostrophes used in the copy).
//
// Numbers stay in Western digits by decision — ৳16,500 not ৳১৬,৫০০ — so amounts, phone numbers
// and receipts read consistently. Only words are translated. Month names live in lib/format.ts.
//
// The super-admin console (app/admin/page.tsx) is intentionally NOT translated.
// =============================================================================

export const bn: Record<string, string> = {
  // ---------------------------------------------------------------- legal / consent
  // The consent sentence is one key with {terms}/{privacy} placeholders, not three fragments —
  // Bangla orders the noun phrases differently and joined fragments read as nonsense there.
  "I agree to the {terms} and the {privacy}.": "আমি {terms} এবং {privacy} মেনে নিচ্ছি।",
  "Please accept the Terms and Privacy Policy.":
    "অনুগ্রহ করে শর্তাবলি ও গোপনীয়তা নীতি মেনে নিন।",
  "Terms & Conditions": "শর্তাবলি",
  "Privacy Policy": "গোপনীয়তা নীতি",
  Terms: "শর্তাবলি",
  Privacy: "গোপনীয়তা",
  Back: "ফিরে যান",

  // ---------------------------------------------------------------- login / signup
  "Property Management, Reimagined": "সম্পত্তি ব্যবস্থাপনা, নতুন রূপে",
  "Properties, tenants, billing and requests — one calm dashboard.":
    "সম্পত্তি, ভাড়াটিয়া, বিলিং ও অনুরোধ — একটি সহজ ড্যাশবোর্ডে।",
  "Track occupancy, generate rent invoices, resolve maintenance tickets and broadcast notices from a single, mobile-ready portal.":
    "একটি মোবাইল-বান্ধব পোর্টাল থেকে দখল অবস্থা দেখুন, ভাড়ার চালান তৈরি করুন, রক্ষণাবেক্ষণের অনুরোধ সমাধান করুন এবং নোটিশ পাঠান।",
  "Welcome back": "স্বাগতম",
  "Choose your access portal to continue.": "চালিয়ে যেতে আপনার পোর্টাল বেছে নিন।",
  Resident: "ভাড়াটিয়া",
  Owner: "মালিক",
  "Registered phone": "নিবন্ধিত ফোন নম্বর",
  Passcode: "পাসকোড",
  "Tip: your passcode was provided by your landlord.":
    "পরামর্শ: আপনার পাসকোড বাড়ির মালিক দিয়েছেন।",
  "Enter resident portal": "ভাড়াটিয়া পোর্টালে প্রবেশ করুন",
  Email: "ইমেইল",
  "Email or login ID": "ইমেইল বা লগইন আইডি",
  Password: "পাসওয়ার্ড",
  "Sign in": "সাইন ইন",
  "Forgot password?": "পাসওয়ার্ড ভুলে গেছেন?",
  "New here?": "নতুন এসেছেন?",
  "Create an owner account": "মালিক অ্যাকাউন্ট খুলুন",
  "Create your owner account": "আপনার মালিক অ্যাকাউন্ট খুলুন",
  "Start free — you can upgrade your plan anytime.":
    "বিনামূল্যে শুরু করুন — যেকোনো সময় প্ল্যান আপগ্রেড করতে পারবেন।",
  "Your name": "আপনার নাম",
  Phone: "ফোন",
  "At least 8 characters.": "কমপক্ষে ৮টি অক্ষর।",
  "Create account": "অ্যাকাউন্ট তৈরি করুন",
  "Enter your name.": "আপনার নাম লিখুন।",
  "Enter a valid email.": "একটি সঠিক ইমেইল দিন।",
  "Password must be at least 8 characters.": "পাসওয়ার্ড কমপক্ষে ৮টি অক্ষরের হতে হবে।",
  "Welcome to Bari360!": "Bari360-এ স্বাগতম!",
  "Reset your password": "পাসওয়ার্ড রিসেট করুন",
  "We'll email you a secure link to set a new password.":
    "নতুন পাসওয়ার্ড তৈরি করার জন্য আমরা আপনাকে একটি নিরাপদ লিংক ইমেইল করব।",
  "Account email": "অ্যাকাউন্টের ইমেইল",
  "Send reset link": "রিসেট লিংক পাঠান",
  // A building account signs in with a system-issued identifier that has no inbox, so the
  // self-service reset explains rather than promising a link.
  "Building accounts can't reset their own password.":
    "ভবনের অ্যাকাউন্ট নিজে থেকে পাসওয়ার্ড রিসেট করতে পারে না।",
  "Ask your building administrator to set a new one for you — or the platform administrator, if you run the building.":
    "আপনার ভবন প্রশাসককে নতুন একটি পাসওয়ার্ড সেট করে দিতে বলুন — আর ভবনটি যদি আপনি নিজেই পরিচালনা করেন, তাহলে প্ল্যাটফর্ম প্রশাসককে বলুন।",
  "Login ID": "লগইন আইডি",
  "This is what you sign in with. Your building administrator can reset your password.":
    "এটি দিয়েই আপনি সাইন ইন করেন। আপনার ভবন প্রশাসক আপনার পাসওয়ার্ড রিসেট করে দিতে পারবেন।",
  Done: "সম্পন্ন",
  "If an account exists for": "যদি এই ঠিকানায় কোনো অ্যাকাউন্ট থাকে —",
  ", a password reset link is on its way. Check your inbox (and spam folder).":
    " — তাহলে পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে। আপনার ইনবক্স (ও স্প্যাম ফোল্ডার) দেখুন।",

  // ---------------------------------------------------------------- shell / chrome
  "Sign out": "সাইন আউট",
  More: "আরও",
  Close: "বন্ধ করুন",
  "Close menu": "মেনু বন্ধ করুন",
  "Light theme": "লাইট থিম",
  "Dark theme": "ডার্ক থিম",
  "Switch to light theme": "লাইট থিমে পরিবর্তন করুন",
  "Switch to dark theme": "ডার্ক থিমে পরিবর্তন করুন",
  "Switch to Bangla": "বাংলায় পরিবর্তন করুন",
  "Switch to English": "ইংরেজিতে পরিবর্তন করুন",
  "Resident Hub": "ভাড়াটিয়া কেন্দ্র",
  "Owner Console": "মালিক কনসোল",
  Loading: "লোড হচ্ছে",
  "Loading…": "লোড হচ্ছে…",
  Cancel: "বাতিল",
  Save: "সংরক্ষণ",
  Delete: "মুছে ফেলুন",
  Confirm: "নিশ্চিত করুন",
  Search: "খুঁজুন",
  Status: "অবস্থা",
  Remarks: "মন্তব্য",
  Total: "মোট",
  Month: "মাস",
  Amount: "পরিমাণ",
  Type: "ধরন",
  Notes: "নোট",
  Download: "ডাউনলোড",
  Upload: "আপলোড",
  Print: "প্রিন্ট",
  Receipt: "রসিদ",
  WhatsApp: "হোয়াটসঅ্যাপ",

  // ---------------------------------------------------------------- receipt modal
  "Rent receipt": "ভাড়ার রসিদ",
  "Share to WhatsApp, or save the receipt as an image.":
    "হোয়াটসঅ্যাপে পাঠান, বা রসিদটি ছবি হিসেবে সংরক্ষণ করুন।",
  "Share to WhatsApp, send as an image, or download / print.":
    "হোয়াটসঅ্যাপে পাঠান, ছবি হিসেবে পাঠান, বা ডাউনলোড / প্রিন্ট করুন।",
  "Save image": "ছবি সংরক্ষণ করুন",
  "Share image": "ছবি পাঠান",
  "Save & print": "সংরক্ষণ ও প্রিন্ট",
  "Share as HTML file instead": "বরং HTML ফাইল হিসেবে পাঠান",
  "No valid WhatsApp number on file for this tenant.":
    "এই ভাড়াটিয়ার কোনো সঠিক হোয়াটসঅ্যাপ নম্বর নেই।",
  "This tenant has no valid phone number for WhatsApp.":
    "এই ভাড়াটিয়ার হোয়াটসঅ্যাপের জন্য কোনো সঠিক ফোন নম্বর নেই।",
  "Receipt isn't ready yet — try again in a moment.":
    "রসিদ এখনো প্রস্তুত হয়নি — একটু পরে আবার চেষ্টা করুন।",
  "Could not turn the receipt into an image on this device.":
    "এই ডিভাইসে রসিদটিকে ছবিতে রূপান্তর করা যায়নি।",
  "Could not save the receipt to this device.":
    "এই ডিভাইসে রসিদটি সংরক্ষণ করা যায়নি।",
  "Could not download the receipt.": "রসিদ ডাউনলোড করা যায়নি।",
  "Could not share the receipt.": "রসিদ পাঠানো যায়নি।",
  "Could not generate the receipt image.": "রসিদের ছবি তৈরি করা যায়নি।",
  "Printing isn't available here — use Download instead.":
    "এখানে প্রিন্ট করা যায় না — বরং ডাউনলোড ব্যবহার করুন।",
  "Sharing isn't supported on this device — use Download or Print instead.":
    "এই ডিভাইসে শেয়ার করা যায় না — বরং ডাউনলোড বা প্রিন্ট ব্যবহার করুন।",

  // ---------------------------------------------------------------- nav labels
  Home: "হোম",
  Rent: "ভাড়া",
  Requests: "অনুরোধ",
  Notices: "নোটিশ",
  Documents: "কাগজপত্র",
  Settings: "সেটিংস",
  Overview: "সারসংক্ষেপ",
  Properties: "সম্পত্তি",
  Tenants: "ভাড়াটিয়া",
  Billing: "বিলিং",
  Reminders: "রিমাইন্ডার",
  Staff: "কর্মী",
  Accounts: "হিসাব",
  Plan: "প্ল্যান",
  Support: "সহায়তা",

  // ---------------------------------------------------------------- settings / profile
  "Your profile": "আপনার প্রোফাইল",
  "The name and number shown to your tenants.": "আপনার ভাড়াটিয়ারা যে নাম ও নম্বর দেখতে পান।",
  "Your details as your owner sees them.": "বাড়ির মালিক আপনার যে তথ্য দেখতে পান।",
  "Full name": "পুরো নাম",
  "Family members": "পরিবারের সদস্য",
  "How many people live in the unit.": "এই ইউনিটে কতজন থাকেন।",
  "Save profile": "প্রোফাইল সংরক্ষণ করুন",
  "Profile updated.": "প্রোফাইল হালনাগাদ হয়েছে।",
  "Name cannot be empty.": "নাম খালি রাখা যাবে না।",
  "This is the account you sign in with. Contact support to change it.":
    "এই অ্যাকাউন্ট দিয়ে আপনি সাইন ইন করেন। পরিবর্তনের জন্য সহায়তায় যোগাযোগ করুন।",
  "This is the number you sign in with. Ask your owner if it needs changing.":
    "এই নম্বর দিয়ে আপনি সাইন ইন করেন। পরিবর্তন করতে হলে বাড়ির মালিককে বলুন।",
  "Used on receipts and for tenants to reach you.":
    "রসিদে এবং ভাড়াটিয়াদের যোগাযোগের জন্য ব্যবহৃত হয়।",
  "App & notifications": "অ্যাপ ও নোটিফিকেশন",
  "Settings for this device only — they do not affect your other phones or browsers.":
    "শুধু এই ডিভাইসের জন্য প্রযোজ্য — আপনার অন্য ফোন বা ব্রাউজারে প্রভাব ফেলবে না।",
  "This browser cannot receive push notifications. Install the Android app or use Chrome to get rent, invoice and maintenance alerts.":
    "এই ব্রাউজারে পুশ নোটিফিকেশন আসে না। ভাড়া, চালান ও রক্ষণাবেক্ষণের খবর পেতে অ্যান্ড্রয়েড অ্যাপ ইনস্টল করুন বা ক্রোম ব্যবহার করুন।",
  "Notifications are blocked for this app. Re-enable them in your browser or system settings, then reload this page.":
    "এই অ্যাপের নোটিফিকেশন বন্ধ করা আছে। ব্রাউজার বা সিস্টেম সেটিংস থেকে চালু করে পেজটি রিলোড করুন।",
  "Android app — updates install from the in-app prompt.":
    "অ্যান্ড্রয়েড অ্যাপ — অ্যাপের ভেতরের বার্তা থেকে আপডেট ইনস্টল হয়।",
  "Web app": "ওয়েব অ্যাপ",
  "it updates automatically when you reload.": "রিলোড করলেই স্বয়ংক্রিয়ভাবে হালনাগাদ হয়।",
  "Notifications are on for this device.": "এই ডিভাইসে নোটিফিকেশন চালু আছে।",
  "Enable notifications": "নোটিফিকেশন চালু করুন",
  "Send test notification": "পরীক্ষামূলক নোটিফিকেশন পাঠান",
  "Check for updates": "আপডেট দেখুন",
  "Turn on notifications for invoices, payments and maintenance updates.":
    "চালান, পেমেন্ট ও রক্ষণাবেক্ষণের খবর পেতে নোটিফিকেশন চালু করুন।",
  "Notification sound": "নোটিফিকেশনের শব্দ",
  "Applies to all your devices, not just this one.":
    "আপনার সব ডিভাইসে প্রযোজ্য, শুধু এটিতে নয়।",
  "Play the Bari360 tone": "বাড়ি৩৬০-এর সুরটি বাজান",
  "Bari360 tone": "বাড়ি৩৬০ সুর",
  "Device tone": "ডিভাইসের সুর",
  "Silent": "নিঃশব্দ",
  "On the web the Bari360 tone plays while the app is open. When it is closed your browser uses its own sound. Install the Android app for the tone every time.":
    "ওয়েবে অ্যাপ খোলা থাকলে বাড়ি৩৬০-এর সুরটি বাজে। অ্যাপ বন্ধ থাকলে ব্রাউজার তার নিজের শব্দ ব্যবহার করে। সব সময় এই সুর পেতে অ্যান্ড্রয়েড অ্যাপ ইনস্টল করুন।",
  "Change password": "পাসওয়ার্ড পরিবর্তন",
  "Update the password you use to sign in.": "সাইন ইন করার পাসওয়ার্ড পরিবর্তন করুন।",
  "Current password": "বর্তমান পাসওয়ার্ড",
  "New password": "নতুন পাসওয়ার্ড",
  "Confirm new password": "নতুন পাসওয়ার্ড নিশ্চিত করুন",
  "Update password": "পাসওয়ার্ড হালনাগাদ করুন",
  "Password updated.": "পাসওয়ার্ড হালনাগাদ হয়েছে।",
  "Show password": "পাসওয়ার্ড দেখান",
  "Hide password": "পাসওয়ার্ড লুকান",
  "New passwords do not match.": "নতুন পাসওয়ার্ড দুটি মিলছে না।",
  "New password must be at least 8 characters.": "নতুন পাসওয়ার্ড কমপক্ষে ৮টি অক্ষরের হতে হবে।",
  "Your profile and this device's preferences.": "আপনার প্রোফাইল ও এই ডিভাইসের পছন্দসমূহ।",
  "System preferences for your account.": "আপনার অ্যাকাউন্টের সেটিংস।",

  // ---------------------------------------------------------------- maintenance gate
  "System under maintenance": "সিস্টেম রক্ষণাবেক্ষণে আছে",
  "Maintenance window": "রক্ষণাবেক্ষণের সময়",
  "Continue to sign in": "সাইন ইন করতে এগিয়ে যান",

  // ---------------------------------------------------------------- announcement popup
  "Got it": "বুঝেছি",

  // ---------------------------------------------------------------- tenant dashboard
  "Here's the current status of your suite.": "আপনার ইউনিটের বর্তমান অবস্থা এখানে।",
  "Amount due": "বকেয়া পরিমাণ",
  "Open requests": "চলমান অনুরোধ",
  "In progress": "চলমান",
  "From management": "ব্যবস্থাপনা থেকে",
  "All settled 🎉": "সব পরিশোধিত 🎉",
  "Latest notice": "সর্বশেষ নোটিশ",
  "No announcements right now.": "এই মুহূর্তে কোনো ঘোষণা নেই।",
  "Rent & ledger": "ভাড়া ও হিসাব",
  "Your complete billing history.": "আপনার সম্পূর্ণ বিলিং ইতিহাস।",
  "Total paid": "মোট পরিশোধিত",
  "No invoices yet": "এখনো কোনো চালান নেই",
  "Your rent invoices will appear here once your owner generates them.":
    "বাড়ির মালিক চালান তৈরি করলে সেগুলো এখানে দেখা যাবে।",
  "No requests filed": "কোনো অনুরোধ জমা দেওয়া হয়নি",
  "Report a maintenance issue and your owner will be notified.":
    "রক্ষণাবেক্ষণের সমস্যা জানান, বাড়ির মালিক জানতে পারবেন।",
  "Files your owner has shared with you — view or download.":
    "বাড়ির মালিক আপনার সাথে যে ফাইল শেয়ার করেছেন — দেখুন বা ডাউনলোড করুন।",
  "No documents yet": "এখনো কোনো কাগজপত্র নেই",
  "When your owner shares a deed, agreement or receipt, it will appear here.":
    "বাড়ির মালিক দলিল, চুক্তি বা রসিদ শেয়ার করলে তা এখানে দেখা যাবে।",
  "Charge breakdown": "খরচের বিবরণ",
  "Rent marked as sent — your owner has been notified.":
    "ভাড়া পাঠানো হিসেবে চিহ্নিত হয়েছে — বাড়ির মালিক জানতে পেরেছেন।",
  "Maintenance request submitted.": "রক্ষণাবেক্ষণের অনুরোধ জমা হয়েছে।",
  "We couldn't determine your unit yet — once you have a billing record you can file tickets.":
    "আপনার ইউনিট এখনো শনাক্ত করা যায়নি — বিলিং রেকর্ড হলে আপনি অনুরোধ জমা দিতে পারবেন।",
  "Loading your home…": "আপনার তথ্য লোড হচ্ছে…",
  "Fetching rent, requests & notices": "ভাড়া, অনুরোধ ও নোটিশ আনা হচ্ছে",
  "Service + Extra": "সার্ভিস + অতিরিক্ত",
  Payment: "পেমেন্ট",
  "New request": "নতুন অনুরোধ",
  Maintenance: "রক্ষণাবেক্ষণ",
  "Report issues and track their progress.": "সমস্যা জানান এবং অগ্রগতি দেখুন।",
  "Announcements from your property owner.": "বাড়ির মালিকের পক্ষ থেকে ঘোষণা।",
  "Inbox empty": "ইনবক্স খালি",
  "You'll see building updates and reminders here.":
    "ভবনের খবর ও রিমাইন্ডার এখানে দেখতে পাবেন।",

  // ---------------------------------------------------------------- notices
  // A notice's title/content is free text, so only the strings Bari360's OWN backend writes
  // can be translated — see lib/notice-i18n.ts. These must match the backend byte for byte:
  // 'Rent reminder' comes from rent-master-pwa/lib/reminders.ts, the other two from
  // rent-master-pwa/app/api/admin/billing/[id]/route.ts. An owner's typed prose is left as-is.
  "Rent reminder": "ভাড়ার রিমাইন্ডার",
  "Rent payment marked as sent": "ভাড়া পাঠানো হিসেবে চিহ্নিত",
  "{0} marked the rent for {1} (৳{2}) as sent. Please verify the payment and confirm receipt.":
    "{0} {1} মাসের ভাড়া (৳{2}) পাঠানো হিসেবে চিহ্নিত করেছেন। পেমেন্ট যাচাই করে প্রাপ্তি নিশ্চিত করুন।",
  "New notice": "নতুন নোটিশ",
  "No notices yet": "এখনো কোনো নোটিশ নেই",
  // Audience + sender badges on the owner's notice cards.
  "All tenants": "সব ভাড়াটিয়া",
  "One tenant": "একজন ভাড়াটিয়া",
  "All owners": "সব মালিক",
  "Payment update": "পেমেন্ট আপডেট",
  "Building notice": "ভবনের নোটিশ",
  "For you": "আপনার জন্য",
  System: "সিস্টেম",
  Tenant: "ভাড়াটিয়া",
  You: "আপনি",
  "Building admin": "ভবন প্রশাসক",

  // Screen-reader label on the crown marking a locked add-on in the nav.
  "Paid add-on": "পেইড অ্যাড-অন",
  "Your residence": "আপনার বাসস্থান",
  "Rent terms": "ভাড়ার শর্ত",
  "Your details": "আপনার তথ্য",
  "Owner contact": "মালিকের যোগাযোগ",
  "Monthly rent": "মাসিক ভাড়া",
  "Flat / Unit": "ফ্ল্যাট / ইউনিট",
  Address: "ঠিকানা",
  "Service charge": "সার্ভিস চার্জ",
  "Advance held": "জমা অগ্রিম",
  "Rent due": "ভাড়ার শেষ তারিখ",
  Name: "নাম",
  Number: "নম্বর",
  Household: "পরিবার",
  "Resident since": "বসবাস শুরু",
  "View charge breakdown": "খরচের বিবরণ দেখুন",
  "Download receipt": "রসিদ ডাউনলোড করুন",
  "Base rent": "মূল ভাড়া",
  "Extra charge": "অতিরিক্ত চার্জ",
  Discount: "ছাড়",
  "Total payable": "মোট প্রদেয়",
  "Rent revision history": "ভাড়া পরিবর্তনের ইতিহাস",
  "Every change to your rent, most recent first.":
    "আপনার ভাড়ার সব পরিবর্তন, সাম্প্রতিকটি আগে।",
  "Your property owner": "আপনার বাড়ির মালিক",
  Dismiss: "বন্ধ করুন",

  // ---------------------------------------------------------------- owner dashboard
  "Portfolio overview": "পোর্টফোলিও সারসংক্ষেপ",
  "A live snapshot of your properties, income and open work.":
    "আপনার সম্পত্তি, আয় ও চলমান কাজের সরাসরি চিত্র।",
  Property: "সম্পত্তি",
  "New invoice": "নতুন চালান",
  "Broadcast announcements to your tenants.": "আপনার ভাড়াটিয়াদের ঘোষণা পাঠান।",
  "Incident tickets reported across your portfolio.":
    "আপনার সব সম্পত্তি থেকে আসা সমস্যার অনুরোধ।",
  "Maintenance requests": "রক্ষণাবেক্ষণের অনুরোধ",
  "Rent reminders": "ভাড়ার রিমাইন্ডার",
  "Schedule reminders to your tenants — once or every month.":
    "ভাড়াটিয়াদের রিমাইন্ডার নির্ধারণ করুন — একবার বা প্রতি মাসে।",
  "Your plan": "আপনার প্ল্যান",
  "Manage your subscription, limits and renewals.":
    "আপনার সাবস্ক্রিপশন, সীমা ও নবায়ন পরিচালনা করুন।",
  "Tenant documents": "ভাড়াটিয়ার কাগজপত্র",
  "Document title": "কাগজের শিরোনাম",
  "Upload document": "কাগজ আপলোড করুন",
  "Existing documents": "বিদ্যমান কাগজপত্র",
  "Document uploaded.": "কাগজ আপলোড হয়েছে।",
  "Document deleted.": "কাগজ মুছে ফেলা হয়েছে।",
  "Delete document?": "কাগজ মুছে ফেলবেন?",
  "This permanently removes the document.": "এটি কাগজটি স্থায়ীভাবে মুছে ফেলবে।",
  "Update maintenance status": "রক্ষণাবেক্ষণের অবস্থা হালনাগাদ",
  "Shared with the tenant on their request.": "ভাড়াটিয়ার অনুরোধের সাথে দেখানো হবে।",
  "Save update": "হালনাগাদ সংরক্ষণ করুন",
  "Request updated.": "অনুরোধ হালনাগাদ হয়েছে।",
  Reported: "জানানো হয়েছে",
  Resolved: "সমাধান হয়েছে",
  "WhatsApp receipt message": "হোয়াটসঅ্যাপ রসিদ বার্তা",
  "Sent alongside a rent receipt when you share it to WhatsApp.":
    "হোয়াটসঅ্যাপে রসিদ পাঠানোর সময় এই বার্তাটি যাবে।",
  "Message template": "বার্তার নমুনা",
  "Save message": "বার্তা সংরক্ষণ করুন",
  "Message template saved.": "বার্তার নমুনা সংরক্ষিত হয়েছে।",
  "Rent reminder message": "ভাড়ার রিমাইন্ডার বার্তা",
  "The default message pre-filled when you create a new reminder.":
    "নতুন রিমাইন্ডার তৈরি করলে যে বার্তাটি আগে থেকে বসানো থাকবে।",
  "Reminder template": "রিমাইন্ডারের নমুনা",
  "Save reminder message": "রিমাইন্ডার বার্তা সংরক্ষণ করুন",
  "Reminder template saved.": "রিমাইন্ডারের নমুনা সংরক্ষিত হয়েছে।",
  "Vacate property?": "সম্পত্তি খালি করবেন?",
  Vacate: "খালি করুন",
  "Loading your portfolio…": "আপনার পোর্টফোলিও লোড হচ্ছে…",
  "Syncing properties, tenants & ledgers": "সম্পত্তি, ভাড়াটিয়া ও হিসাব মেলানো হচ্ছে",
  "Loading your plan…": "আপনার প্ল্যান লোড হচ্ছে…",
  "Fetching your subscription details.": "আপনার সাবস্ক্রিপশনের তথ্য আনা হচ্ছে।",
  "Every unit in your real-estate inventory.": "আপনার তালিকার প্রতিটি ইউনিট।",
  "Add a new unit to your inventory.": "আপনার তালিকায় নতুন ইউনিট যোগ করুন।",
  "Edit property": "সম্পত্তি সম্পাদনা",
  "Edit tenant": "ভাড়াটিয়া সম্পাদনা",
  "Flat / Unit no.": "ফ্ল্যাট / ইউনিট নম্বর",
  "Billing ledger": "বিলিং হিসাব",
  "Generate rent invoices and track payment status.":
    "ভাড়ার চালান তৈরি করুন এবং পেমেন্টের অবস্থা দেখুন।",
  "Create invoice": "চালান তৈরি করুন",
  "Create your first rent invoice for a tenant.":
    "কোনো ভাড়াটিয়ার জন্য প্রথম চালান তৈরি করুন।",
  "Generate a monthly rent invoice for a tenant.":
    "ভাড়াটিয়ার জন্য মাসিক ভাড়ার চালান তৈরি করুন।",
  "Billing month": "বিলিং মাস",
  "Extra charge (৳)": "অতিরিক্ত চার্জ (৳)",
  "Discount (৳)": "ছাড় (৳)",
  "Advance / deposit (৳)": "অগ্রিম / জামানত (৳)",
  "Amount (৳)": "পরিমাণ (৳)",
  "Appears on the receipt — e.g. explain an extra charge.":
    "রসিদে দেখা যাবে — যেমন অতিরিক্ত চার্জের কারণ।",
  Invoices: "চালান",
  "Broadcast notice": "নোটিশ পাঠান",
  "Broadcast rent reminders, maintenance windows or building updates.":
    "ভাড়ার রিমাইন্ডার, রক্ষণাবেক্ষণের সময় বা ভবনের খবর পাঠান।",
  Audience: "প্রাপক",
  Message: "বার্তা",
  "Create a reminder to nudge tenants about rent — pick tenants, write a message, set a date.":
    "ভাড়ার কথা মনে করিয়ে দিতে রিমাইন্ডার তৈরি করুন — ভাড়াটিয়া বাছুন, বার্তা লিখুন, তারিখ দিন।",
  "Day of month (1–31)": "মাসের তারিখ (১–৩১)",
  "Manage the people who work on your properties.":
    "আপনার সম্পত্তিতে যারা কাজ করেন তাদের পরিচালনা করুন।",
  "Add the people who work on your properties — record their salary, and log each payment as you make it.":
    "আপনার সম্পত্তিতে যারা কাজ করেন তাদের যোগ করুন — বেতন লিখুন এবং প্রতিটি পেমেন্ট রেকর্ড করুন।",
  "Active staff": "সক্রিয় কর্মী",
  "Log a salary payment": "বেতন পেমেন্ট রেকর্ড করুন",
  "Joining date": "যোগদানের তারিখ",
  "Add a cash, bank or mobile-money account to start tracking your income and expenses.":
    "আয়-ব্যয় হিসাব রাখতে নগদ, ব্যাংক বা মোবাইল ব্যাংকিং অ্যাকাউন্ট যোগ করুন।",
  Account: "অ্যাকাউন্ট",
  Category: "শ্রেণি",
  "Custom category": "নিজস্ব শ্রেণি",
  Description: "বিবরণ",
  Date: "তারিখ",
  From: "থেকে",
  Method: "মাধ্যম",
  Collected: "আদায়",
  "Complete your payment": "আপনার পেমেন্ট সম্পন্ন করুন",
  "bKash transaction id": "বিকাশ ট্রানজেকশন আইডি",
  "Mobile number you paid from": "যে নম্বর থেকে পেমেন্ট করেছেন",
  "Contact us": "যোগাযোগ করুন",
  "A secure login passcode is generated and shown to you once — share it with the tenant.":
    "একটি নিরাপদ লগইন পাসকোড তৈরি হবে এবং একবারই দেখানো হবে — সেটি ভাড়াটিয়াকে দিন।",
  "Add a tenant to a property. A temporary passcode (last 4 phone digits) is generated automatically.":
    "কোনো সম্পত্তিতে ভাড়াটিয়া যোগ করুন। একটি অস্থায়ী পাসকোড (ফোনের শেষ ৪ সংখ্যা) স্বয়ংক্রিয়ভাবে তৈরি হবে।",
  "Generate a new login passcode": "নতুন লগইন পাসকোড তৈরি করুন",
  "Attached to every rent receipt you issue.": "আপনার প্রতিটি ভাড়ার রসিদে যুক্ত হবে।",
  "JPG, PNG or WebP.": "JPG, PNG বা WebP।",
  File: "ফাইল",
  Edit: "সম্পাদনা",

  // Rendered by every Field that isn't marked required — lowercase, as an aside.
  optional: "ঐচ্ছিক",

  // ---------------------------------------------------------------- statuses
  paid: "পরিশোধিত",
  unpaid: "অপরিশোধিত",
  partial: "আংশিক পরিশোধিত",
  sent: "পাঠানো হয়েছে",
  low: "কম",
  medium: "মাঝারি",
  high: "বেশি",
  urgent: "জরুরি",
  // ---------------------------------------------------------------- 2026-08-10 completion sweep
  // Everything below closed the gap that made the app still read half-English after switching to
  // বাংলা: raw JSX text, <option> labels, placeholders, button captions and toast messages that
  // never reached t(), plus the printable receipt. scripts/check-i18n.mjs now fails if any of it
  // comes back.

  // ---- brand (deliberately NOT translated — it is a name) ----
  Bari360: "Bari360",
  "Bari360 — Property Management": "Bari360 — সম্পত্তি ব্যবস্থাপনা",

  // ---- generic actions and states ----
  "Save changes": "পরিবর্তন সংরক্ষণ করুন",
  "Try again": "আবার চেষ্টা করুন",
  Retry: "আবার চেষ্টা",
  Reset: "রিসেট",
  "Not now": "এখন নয়",
  "Cancel it": "বাতিল করুন",
  Open: "খোলা",
  Current: "বর্তমান",
  Active: "সক্রিয়",
  Disabled: "নিষ্ক্রিয়",
  Unassigned: "অনির্ধারিত",
  Unpaid: "বকেয়া",
  Sent: "পাঠানো হয়েছে",
  Other: "অন্যান্য",
  Custom: "কাস্টম",
  "Custom…": "কাস্টম…",
  "Select…": "নির্বাচন করুন…",
  "No matches": "কোনো মিল নেই",
  "Clear search": "খোঁজা মুছুন",
  Title: "শিরোনাম",
  Subject: "বিষয়",
  Note: "নোট",
  Photo: "ছবি",
  Role: "পদ",
  To: "যাকে",
  Pay: "পরিশোধ",
  Payments: "পরিশোধসমূহ",
  Repeat: "পুনরাবৃত্তি",
  Priority: "অগ্রাধিকার",
  Actions: "কার্যক্রম",
  Extras: "অতিরিক্ত",
  "Mark as": "চিহ্নিত করুন",
  "Due day": "নির্ধারিত দিন",
  "Tenant / Month": "ভাড়াটিয়া / মাস",
  "Back to sign in": "সাইন ইনে ফিরুন",
  "Something went wrong": "কিছু একটা ভুল হয়েছে",
  "This screen ran into an unexpected problem. Your data is safe — try again, and if it keeps happening, share the reference below with support.":
    "এই পাতায় অপ্রত্যাশিত সমস্যা হয়েছে। আপনার তথ্য নিরাপদ আছে — আবার চেষ্টা করুন; বারবার হলে নিচের রেফারেন্সটি সহায়তা কেন্দ্রে জানান।",

  // ---- priorities and severities ----
  Low: "কম",
  Medium: "মাঝারি",
  High: "বেশি",
  Urgent: "জরুরি",
  "Low — standard wear": "কম — স্বাভাবিক ক্ষয়",
  "Medium — needs attention": "মাঝারি — নজর দেওয়া দরকার",
  "High — damaging": "বেশি — ক্ষতি হচ্ছে",
  "Urgent — critical failure": "জরুরি — মারাত্মক সমস্যা",
  Technical: "কারিগরি",
  "Feature request": "নতুন সুবিধার অনুরোধ",

  // ---- properties ----
  "Add property": "সম্পত্তি যোগ করুন",
  "Save property": "সম্পত্তি সংরক্ষণ করুন",
  "Register property": "সম্পত্তি নিবন্ধন করুন",
  "Property name": "সম্পত্তির নাম",
  "Property added.": "সম্পত্তি যোগ হয়েছে।",
  "Property updated.": "সম্পত্তি হালনাগাদ হয়েছে।",
  "No properties yet": "এখনো কোনো সম্পত্তি নেই",
  "No properties yet.": "এখনো কোনো সম্পত্তি নেই।",
  "Register your first unit to start onboarding tenants and billing rent.":
    "ভাড়াটিয়া যুক্ত করা ও ভাড়ার বিল শুরু করতে প্রথম ইউনিটটি নিবন্ধন করুন।",
  "Update this unit's details.": "এই ইউনিটের তথ্য হালনাগাদ করুন।",
  "Search by name, address or flat…": "নাম, ঠিকানা বা ফ্ল্যাট দিয়ে খুঁজুন…",
  "e.g. Grand Crimson Palace": "যেমন: গ্র্যান্ড ক্রিমসন প্যালেস",
  "e.g. 12 Gulshan Ave, Dhaka": "যেমন: ১২ গুলশান এভিনিউ, ঢাকা",
  "Name on receipts": "রসিদে যে নাম থাকবে",
  "Printed at the top of this property's receipts. Leave blank to use your account name.":
    "এই সম্পত্তির রসিদের উপরে ছাপা হবে। ফাঁকা রাখলে আপনার অ্যাকাউন্টের নাম ব্যবহার হবে।",
  Occupancy: "দখল অবস্থা",
  "Occupancy history": "দখলের ইতিহাস",

  // ---- tenants ----
  "Onboard tenant": "ভাড়াটিয়া যুক্ত করুন",
  "Onboard & generate passcode": "যুক্ত করুন ও পাসকোড তৈরি করুন",
  "Onboarded residents and their access credentials.": "যুক্ত ভাড়াটিয়া ও তাদের প্রবেশের তথ্য।",
  "Tenant onboarded.": "ভাড়াটিয়া যুক্ত হয়েছে।",
  "Tenant updated.": "ভাড়াটিয়ার তথ্য হালনাগাদ হয়েছে।",
  "No tenants onboarded": "কোনো ভাড়াটিয়া যুক্ত করা হয়নি",
  "No tenants yet.": "এখনো কোনো ভাড়াটিয়া নেই।",
  "Active residents": "সক্রিয় ভাড়াটিয়া",
  "Search by name, phone or property…": "নাম, ফোন বা সম্পত্তি দিয়ে খুঁজুন…",
  "Select tenant…": "ভাড়াটিয়া নির্বাচন করুন…",
  "Select a property…": "সম্পত্তি নির্বাচন করুন…",
  "— Unassigned —": "— অনির্ধারিত —",
  "Move the tenant to another unit, or leave them unassigned.":
    "ভাড়াটিয়াকে অন্য ইউনিটে সরান, অথবা অনির্ধারিত রাখুন।",
  "Update resident details, move the tenant, or revise rent.":
    "ভাড়াটিয়ার তথ্য হালনাগাদ করুন, ইউনিট বদলান, বা ভাড়া সংশোধন করুন।",
  "Rented since": "ভাড়া নিয়েছেন",
  "Rent due day": "ভাড়ার নির্ধারিত দিন",
  "Monthly rent (৳)": "মাসিক ভাড়া (৳)",
  "Rent (৳)": "ভাড়া (৳)",
  "The agreed figure. Payments are logged separately.": "সম্মত অঙ্ক। পরিশোধ আলাদাভাবে লেখা হয়।",
  "Monthly rent roll": "মাসিক ভাড়ার হিসাব",
  "Expected per month": "প্রতি মাসে প্রত্যাশিত",
  "Current rent": "বর্তমান ভাড়া",
  "No rent revisions yet — your rent has stayed the same since you moved in.":
    "এখনো ভাড়া পরিবর্তন হয়নি — ওঠার পর থেকে আপনার ভাড়া একই আছে।",
  "Tenant login passcode": "ভাড়াটিয়ার প্রবেশ পাসকোড",
  "Reset passcode": "পাসকোড রিসেট করুন",
  "Reset passcode?": "পাসকোড রিসেট করবেন?",
  "Passcode reset.": "পাসকোড রিসেট হয়েছে।",
  "Passcode copied.": "পাসকোড কপি হয়েছে।",
  "Number copied.": "নম্বর কপি হয়েছে।",
  "National ID (NID)": "জাতীয় পরিচয়পত্র (এনআইডি)",
  "National ID number": "জাতীয় পরিচয়পত্র নম্বর",
  "NID number": "এনআইডি নম্বর",
  "NID document": "এনআইডি কাগজ",
  "Stored encrypted. Visible only to you.": "এনক্রিপ্ট করে রাখা হয়। শুধু আপনি দেখতে পাবেন।",
  "Shovon Rahman": "শোভন রহমান",
  "Jane Landlord": "রহিম উদ্দিন",

  // ---- billing and receipts ----
  "Generate invoice": "চালান তৈরি করুন",
  "Invoice created.": "চালান তৈরি হয়েছে।",
  "Invoice total": "চালানের মোট",
  "Already paid": "ইতিমধ্যে পরিশোধিত",
  Balance: "অবশিষ্ট",
  "Balance due": "বকেয়া",
  Outstanding: "বকেয়া",
  "Paid this month": "এই মাসে পরিশোধিত",
  "Paid on": "পরিশোধের তারিখ",
  "Record payment": "পরিশোধ লিখুন",
  "Record what was received and when — a part payment is fine.":
    "কত এবং কবে পাওয়া গেছে লিখুন — আংশিক পরিশোধও চলবে।",
  "Payment received": "পরিশোধ পাওয়া গেছে",
  "Payment history": "পরিশোধের ইতিহাস",
  "Payment deleted.": "পরিশোধ মুছে ফেলা হয়েছে।",
  "Delete payment?": "পরিশোধ মুছবেন?",
  "Delete payments": "পরিশোধ মুছুন",
  "Payments you record for this invoice will appear here.":
    "এই চালানের বিপরীতে লেখা পরিশোধ এখানে দেখা যাবে।",
  "No payments yet": "এখনো কোনো পরিশোধ নেই",
  "Mark as unpaid?": "বকেয়া হিসেবে চিহ্নিত করবেন?",
  "Awaiting owner confirmation": "মালিকের নিশ্চিতকরণের অপেক্ষায়",
  "Your owner will be notified immediately.": "আপনার বাড়িওয়ালাকে সঙ্গে সঙ্গে জানানো হবে।",
  "Search by tenant, month or status…": "ভাড়াটিয়া, মাস বা অবস্থা দিয়ে খুঁজুন…",
  "Receipt & share": "রসিদ ও শেয়ার",
  "Rent Receipt": "ভাড়ার রসিদ",
  "Owner Copy": "মালিকের কপি",
  "Tenant Copy": "ভাড়াটিয়ার কপি",
  "Share tenant copy": "ভাড়াটিয়ার কপি শেয়ার করুন",
  "Settled — this invoice is locked": "পরিশোধিত — এই চালানটি লক করা",
  "This invoice is settled — payments can no longer be changed.":
    "এই চালানটি পরিশোধিত — পেমেন্ট আর পরিবর্তন করা যাবে না।",
  "Message copied — long-press to paste it as the caption in WhatsApp.":
    "বার্তা কপি হয়েছে — WhatsApp-এ ক্যাপশন হিসেবে পেস্ট করতে চেপে ধরুন।",
  "Hello {tenant}, please find your rent receipt for {month}. Amount: {amount} ({status}).":
    "প্রিয় {tenant}, {month} মাসের ভাড়ার রসিদ পাঠানো হলো। পরিমাণ: {amount} ({status})।",
  "Leave blank to use a sensible default. Placeholders are filled in per receipt.":
    "ফাঁকা রাখলে একটি সাধারণ বার্তা ব্যবহার হবে। প্রতিটি রসিদে প্লেসহোল্ডারগুলো বসে যাবে।",

  // ---- service charge ----
  "Service charge (৳)": "সার্ভিস চার্জ (৳)",
  "Service charge breakdown": "সার্ভিস চার্জের বিবরণ",
  "Service charges saved.": "সার্ভিস চার্জ সংরক্ষিত হয়েছে।",
  "Total service charge": "মোট সার্ভিস চার্জ",
  "Save breakdown": "বিবরণ সংরক্ষণ করুন",
  "View service charge breakdown": "সার্ভিস চার্জের বিবরণ দেখুন",
  "What your monthly service charge covers.": "আপনার মাসিক সার্ভিস চার্জে যা যা অন্তর্ভুক্ত।",
  "Loading breakdown…": "বিবরণ আসছে…",
  Caretaker: "কেয়ারটেকার",
  "Security guard": "নিরাপত্তা প্রহরী",
  "Lift maintenance": "লিফট রক্ষণাবেক্ষণ",
  Water: "পানি",
  "Common electricity": "সাধারণ বিদ্যুৎ",
  "Common gas": "সাধারণ গ্যাস",
  "Dust collectors": "ময়লা সংগ্রহ",

  // ---- maintenance and support ----
  "Recent maintenance": "সাম্প্রতিক রক্ষণাবেক্ষণ",
  "No maintenance reported. 🎉": "কোনো রক্ষণাবেক্ষণের অভিযোগ নেই। 🎉",
  "No maintenance tickets": "কোনো রক্ষণাবেক্ষণ অনুরোধ নেই",
  "When tenants report issues, they'll appear here.": "ভাড়াটিয়ারা সমস্যা জানালে সেগুলো এখানে দেখা যাবে।",
  "Report an issue": "সমস্যা জানান",
  "Issue title": "সমস্যার শিরোনাম",
  "Describe the issue in detail…": "সমস্যাটি বিস্তারিত লিখুন…",
  "Describe the problem in detail…": "সমস্যাটি বিস্তারিত লিখুন…",
  "e.g. Washroom pipe leakage": "যেমন: বাথরুমের পাইপ লিক করছে",
  "e.g. Water supply maintenance": "যেমন: পানি সরবরাহের কাজ",
  "e.g. Plumber scheduled for Friday; parts ordered.":
    "যেমন: শুক্রবার প্লাম্বার আসবে; যন্ত্রাংশ অর্ডার করা হয়েছে।",
  "Photos of the issue": "সমস্যার ছবি",
  "Attach one or more images (max 8MB each).": "এক বা একাধিক ছবি যুক্ত করুন (প্রতিটি সর্বোচ্চ 8MB)।",
  Screenshots: "স্ক্রিনশট",
  "Owner note:": "মালিকের নোট:",
  "Owner update:": "মালিকের হালনাগাদ:",
  "Raise a ticket": "টিকিট খুলুন",
  "Raise an issue or a question with the Bari360 admin team.":
    "Bari360 প্রশাসনের কাছে কোনো সমস্যা বা প্রশ্ন জানান।",
  "Stuck on something? Raise a ticket and an admin will pick it up.":
    "কোথাও আটকে গেছেন? টিকিট খুলুন, একজন প্রশাসক দেখবেন।",
  "Ticket raised — an admin will pick it up.": "টিকিট খোলা হয়েছে — একজন প্রশাসক দেখবেন।",
  "The Bari360 admin team will be notified.": "Bari360 প্রশাসনকে জানানো হবে।",
  "No support tickets": "কোনো সহায়তা টিকিট নেই",
  "e.g. Locked out after renewing my plan": "যেমন: প্ল্যান নবায়নের পর ঢুকতে পারছি না",

  // ---- notices and reminders ----
  "Send an announcement to your tenants.": "আপনার ভাড়াটিয়াদের একটি ঘোষণা পাঠান।",
  "Write your announcement…": "আপনার ঘোষণা লিখুন…",
  "Notice sent.": "নোটিশ পাঠানো হয়েছে।",
  Recipients: "প্রাপক",
  "A specific tenant": "নির্দিষ্ট একজন ভাড়াটিয়া",
  "Select at least one tenant (or choose All tenants).":
    "অন্তত একজন ভাড়াটিয়া নির্বাচন করুন (অথবা সব ভাড়াটিয়া বেছে নিন)।",
  "Please add a message.": "একটি বার্তা লিখুন।",
  "Write a message.": "একটি বার্তা লিখুন।",
  "New reminder": "নতুন রিমাইন্ডার",
  "New rent reminder": "নতুন ভাড়ার রিমাইন্ডার",
  "Pick tenants, write the message, and choose when it goes out.":
    "ভাড়াটিয়া বাছুন, বার্তা লিখুন, আর কখন যাবে তা ঠিক করুন।",
  "Write the reminder…": "রিমাইন্ডারটি লিখুন…",
  "Send now": "এখনই পাঠান",
  "One-time": "একবার",
  "Every month on this day": "প্রতি মাসের এই দিনে",
  "No reminders yet": "এখনো কোনো রিমাইন্ডার নেই",
  "Reminder deleted.": "রিমাইন্ডার মুছে ফেলা হয়েছে।",
  "Delete reminder?": "রিমাইন্ডার মুছবেন?",
  "Cancel reminder?": "রিমাইন্ডার বাতিল করবেন?",
  "It won't be sent.": "এটি আর পাঠানো হবে না।",
  "Hello {tenant}, your rent of {amount} for {month} is due. Please pay by the {due_date}.":
    "প্রিয় {tenant}, {month} মাসের {amount} ভাড়া বাকি আছে। অনুগ্রহ করে {due_date} তারিখের মধ্যে পরিশোধ করুন।",
  "Leave blank to use a sensible default. Placeholders are filled in per tenant at send time.":
    "ফাঁকা রাখলে একটি সাধারণ বার্তা ব্যবহার হবে। পাঠানোর সময় প্রতিটি ভাড়াটিয়ার জন্য প্লেসহোল্ডার বসে যাবে।",

  // ---- documents ----
  Deed: "দলিল",
  Agreement: "চুক্তিপত্র",
  "e.g. Property deed": "যেমন: সম্পত্তির দলিল",
  "No documents yet for this tenant.": "এই ভাড়াটিয়ার এখনো কোনো কাগজ নেই।",
  "PDF or image, up to 8MB.": "PDF বা ছবি, সর্বোচ্চ 8MB।",
  "Please choose a PDF or an image.": "একটি PDF বা ছবি বেছে নিন।",
  "Please choose an image (a transparent PNG works best).":
    "একটি ছবি বেছে নিন (স্বচ্ছ PNG সবচেয়ে ভালো)।",
  "Image must be under 8MB.": "ছবিটি 8MB-এর কম হতে হবে।",

  // ---- signature ----
  "Your signature": "আপনার স্বাক্ষর",
  "Save signature": "স্বাক্ষর সংরক্ষণ করুন",
  "Signature saved.": "স্বাক্ষর সংরক্ষিত হয়েছে।",
  "Transparent PNG recommended": "স্বচ্ছ PNG দেওয়াই ভালো",
  // components/signature-card.tsx — the upload card.
  "Authorised signature": "অনুমোদিত স্বাক্ষর",
  Signature: "স্বাক্ষর",
  "Upload signature image": "স্বাক্ষরের ছবি আপলোড করুন",
  "Replace signature image": "স্বাক্ষরের ছবি বদলান",
  "Uploading…": "আপলোড হচ্ছে…",
  // components/signature-pad.tsx — draw it instead of uploading a scan.
  // ⚠️ check-i18n CANNOT SEE the first three: the tab labels and the save caption reach t() as
  // variables (`t(label)`, and a Button child bound to a prop), which the scanner has no way to
  // resolve. They are listed here by hand, and a rename in either component has to be repeated
  // here or the control silently goes back to English.
  Draw: "আঁকুন",
  // Upload is already defined at the top of the file (the shared action label) — do not re-add it.
  "Replace signature": "স্বাক্ষর বদলান",
  Undo: "আগেরটায় ফিরুন",
  Clear: "মুছে ফেলুন",
  "Sign above the line": "রেখার উপরে স্বাক্ষর করুন",
  "Use your finger, a stylus or the mouse. Your signature is saved as a transparent image.":
    "আঙুল, স্টাইলাস বা মাউস দিয়ে স্বাক্ষর করুন। স্বাক্ষরটি স্বচ্ছ ছবি হিসেবে সংরক্ষিত হবে।",

  // ---- Whole Building: the PRINTED documents (lib/building-print.ts) + print modal ----
  // These leave the app and land in an owner's hands on paper, so the language must not revert
  // to English the way it once did on receipts.
  "Income & Expense Statement": "আয় ও ব্যয়ের বিবরণী",
  "Service Charge Statement": "সার্ভিস চার্জ বিবরণী",
  "Authorised Signature": "অনুমোদিত স্বাক্ষর",
  "Generated on": "তৈরির তারিখ",
  "Issued": "ইস্যুর তারিখ",
  "Period": "সময়কাল",
  "Surplus": "উদ্বৃত্ত",
  "Deficit": "ঘাটতি",
  "Flat": "ফ্ল্যাট",
  "Nothing recorded in this period.": "এই সময়ে কোনো লেনদেন রেকর্ড হয়নি।",
  "No invoices have been issued yet.": "এখনও কোনো ইনভয়েস দেওয়া হয়নি।",
  "Balance shown is the amount outstanding after each month's invoice.": "প্রতিটি মাসের ইনভয়েসের পর অবশিষ্ট বকেয়া এখানে দেখানো হয়েছে।",
  "Your browser's print dialog can also save this as a PDF.": "আপনার ব্রাউজারের প্রিন্ট উইন্ডো থেকে এটি PDF হিসেবেও সংরক্ষণ করা যাবে।",
  "Saved to": "সংরক্ষণ করা হয়েছে",
  "The document isn't ready yet — try again in a moment.": "ডকুমেন্টটি এখনও প্রস্তুত নয় — একটু পরে আবার চেষ্টা করুন।",
  "Could not turn the document into an image on this device.": "এই ডিভাইসে ডকুমেন্টটিকে ছবিতে রূপান্তর করা যায়নি।",

  // ---- Whole Building: the PLAN invoice & payment receipt (lib/building-print.ts) ----
  // Bari360's own bill to a building, and the receipt for what it paid. Unlike the documents
  // above these come FROM us, not from the building — but they still land on paper in a
  // building committee's file, so they translate like everything else here.
  "Plan Invoice": "প্ল্যান চালান",
  "Payment Receipt": "পেমেন্ট রসিদ",
  "Billed to": "বিল প্রাপক",
  "Received from": "যার কাছ থেকে প্রাপ্ত",
  "Due by": "পরিশোধের শেষ তারিখ",
  "Subtotal": "উপমোট",
  "Payment date": "পেমেন্টের তারিখ",
  "Amount received": "প্রাপ্ত পরিমাণ",
  "Against invoice": "যে চালানের বিপরীতে",
  "Reference": "রেফারেন্স",
  "No lines on this invoice.": "এই চালানে কোনো খাত নেই।",

  // ---- Whole Building: the flat owner's service-charge tab (components/service-charge-tab.tsx) ----
  // Read-only on purpose — the building administrator issues these and records the money.
  "Service charge invoice": "সার্ভিস চার্জ ইনভয়েস",
  "What your building bills you each month, and what has been received.": "আপনার ভবন প্রতি মাসে আপনার কাছে যা দাবি করে এবং যা জমা পড়েছে।",
  "Your building administrator issues these invoices and records the payments.": "আপনার ভবন প্রশাসক এই ইনভয়েসগুলো তৈরি করেন এবং পেমেন্ট রেকর্ড করেন।",
  "No service charge invoices yet": "এখনও কোনো সার্ভিস চার্জ ইনভয়েস নেই",
  "Your building administrator has not issued one to you.": "আপনার ভবন প্রশাসক এখনও আপনাকে কোনো ইনভয়েস দেননি।",
  "Nothing received against this invoice yet.": "এই ইনভয়েসের বিপরীতে এখনও কিছু জমা পড়েনি।",
  "Billed": "দাবিকৃত",
  "Received": "জমা",
  "Due": "বকেয়া",
  "Payable": "প্রদেয়",
  "Still due": "এখনও বকেয়া",
  "Details": "বিস্তারিত",
  "Invoice": "ইনভয়েস",
  // The owner's own printable copies — the same two documents their building administrator
  // issues, so the wording matches the printed headings above.
  "Print statement": "বিবরণী প্রিন্ট করুন",
  "Service charge receipt": "সার্ভিস চার্জ রসিদ",
  "Service charge statement": "সার্ভিস চার্জ বিবরণী",
  "Every month you have been billed, and the balance after each.": "প্রতি মাসের দাবি এবং প্রতিটির পরে অবশিষ্ট বকেয়া।",
  "Your building details are still loading — try again in a moment.": "আপনার ভবনের তথ্য এখনও লোড হচ্ছে — একটু পরে আবার চেষ্টা করুন।",

  // ---- plan and payment ----
  // Whole Building: what a flat owner sees instead of a price list, because their building
  // administrator is the billing party.
  "This account is covered by your building's plan.": "এই অ্যাকাউন্টটি আপনার ভবনের প্ল্যানের আওতাভুক্ত।",
  "Your building administrator manages and pays for this plan.": "আপনার ভবন প্রশাসক এই প্ল্যানটি পরিচালনা করেন এবং এর খরচ বহন করেন।",
  "Your flat": "আপনার ফ্ল্যাট",
  "There is nothing to pay and nothing to renew here. To change what your account can do, speak to your building administrator.": "এখানে কোনো পেমেন্ট বা নবায়নের প্রয়োজন নেই। আপনার অ্যাকাউন্টের সুবিধা পরিবর্তন করতে ভবন প্রশাসকের সঙ্গে যোগাযোগ করুন।",
  "Available plans": "সম্ভাব্য প্ল্যান",
  "Current plan": "বর্তমান প্ল্যান",
  "Choose a plan": "একটি প্ল্যান বেছে নিন",
  "Renew my plan": "প্ল্যান নবায়ন করুন",
  Upgrade: "আপগ্রেড",
  "Upgrade to re-enable": "চালু করতে আপগ্রেড করুন",
  "Unlimited on your plan": "আপনার প্ল্যানে সীমাহীন",
  "Limit reached — upgrade to add more.": "সীমা শেষ — আরও যোগ করতে আপগ্রেড করুন।",
  "Downgrade blocked": "ডাউনগ্রেড আটকানো হয়েছে",
  "Free plan — activation is instant.": "ফ্রি প্ল্যান — সঙ্গে সঙ্গে চালু হবে।",
  "Arranged for your account — not publicly listed.":
    "আপনার অ্যাকাউন্টের জন্য বিশেষভাবে ঠিক করা — সবার জন্য তালিকাভুক্ত নয়।",
  "Expiring soon": "শীঘ্রই মেয়াদ শেষ",
  "In grace": "ছাড়ের সময়ে",
  "Plan ended": "প্ল্যান শেষ",
  "Your plan expires soon": "আপনার প্ল্যানের মেয়াদ শীঘ্রই শেষ",
  "Your plan has expired": "আপনার প্ল্যানের মেয়াদ শেষ হয়েছে",
  "Your plan has ended": "আপনার প্ল্যান শেষ হয়েছে",
  "your plan": "আপনার প্ল্যান",
  "You are now on the free plan": "আপনি এখন ফ্রি প্ল্যানে আছেন",
  "Continue on free": "ফ্রিতেই চালিয়ে যান",
  "Renew now to keep everything exactly as it is — your properties, tenants and any paid modules stay untouched.":
    "সবকিছু আগের মতো রাখতে এখনই নবায়ন করুন — আপনার সম্পত্তি, ভাড়াটিয়া ও পেইড সুবিধাগুলো অক্ষত থাকবে।",
  "You can still manage everything for a few more days. After that your account moves to the free plan.":
    "আরও কয়েক দিন সবকিছু আগের মতোই চালাতে পারবেন। এরপর আপনার অ্যাকাউন্ট ফ্রি প্ল্যানে চলে যাবে।",
  "Nothing has been deleted. Anything beyond the free limits is still here — it is just view-only until you choose a plan again.":
    "কোনো তথ্য মুছে ফেলা হয়নি। ফ্রি সীমার বাইরের সবকিছু রয়ে গেছে — নতুন প্ল্যান না নেওয়া পর্যন্ত সেগুলো শুধু দেখা যাবে।",
  "Submit for approval": "অনুমোদনের জন্য পাঠান",
  "Payment awaiting approval": "পরিশোধ অনুমোদনের অপেক্ষায়",
  "You already have a payment awaiting approval.": "আপনার একটি পরিশোধ ইতিমধ্যে অনুমোদনের অপেক্ষায় আছে।",
  "Your last payment could not be approved": "আপনার সর্বশেষ পরিশোধ অনুমোদন করা যায়নি",
  "Payment submitted — we'll activate your plan once it's approved.":
    "পরিশোধ জমা হয়েছে — অনুমোদনের পরই আপনার প্ল্যান চালু করা হবে।",
  "Enter the bKash transaction id.": "বিকাশ লেনদেন আইডি লিখুন।",
  "After paying, enter your payment details below so we can verify and activate your plan.":
    "পরিশোধের পর নিচে আপনার লেনদেনের তথ্য দিন, যাতে আমরা যাচাই করে প্ল্যান চালু করতে পারি।",
  "Payment details haven't been set up yet. Please contact us.":
    "পরিশোধের তথ্য এখনো ঠিক করা হয়নি। অনুগ্রহ করে আমাদের সাথে যোগাযোগ করুন।",
  "Tap the QR to enlarge and scan": "স্ক্যান করতে QR-এ চাপ দিয়ে বড় করুন",
  "Tap to enlarge and scan": "স্ক্যান করতে চাপ দিয়ে বড় করুন",
  "Tap anywhere to close": "বন্ধ করতে যেকোনো জায়গায় চাপ দিন",
  "Whole Building": "পুরো ভবন",
  "Send enquiry": "অনুসন্ধান পাঠান",
  "Tell us about your building and what you need…": "আপনার ভবন ও প্রয়োজন সম্পর্কে লিখুন…",
  "Thanks — our team will reach out to you soon.": "ধন্যবাদ — আমাদের টিম শীঘ্রই যোগাযোগ করবে।",

  // ---- staff add-on ----
  "Staff is an add-on": "স্টাফ একটি অ্যাড-অন",
  "Contact us to enable Staff": "স্টাফ চালু করতে যোগাযোগ করুন",
  "Your caretakers, guards and cleaners — their details, and what you've paid them.":
    "আপনার কেয়ারটেকার, প্রহরী ও পরিচ্ছন্নতাকর্মী — তাদের তথ্য ও পরিশোধের হিসাব।",
  "No staff yet": "এখনো কোনো স্টাফ নেই",
  "Remove staff member?": "স্টাফ সরিয়ে দেবেন?",
  "Search by name, phone, role or property…": "নাম, ফোন, পদ বা সম্পত্তি দিয়ে খুঁজুন…",
  "Select a role…": "পদ নির্বাচন করুন…",
  "No property assigned": "কোনো সম্পত্তি নির্ধারিত নেই",
  "Where they live": "কোথায় থাকেন",
  "Monthly salary": "মাসিক বেতন",
  "Monthly wage bill": "মাসিক বেতনের খরচ",
  "e.g. July salary, or an advance": "যেমন: জুলাই মাসের বেতন, বা অগ্রিম",
  "Payments you log for this person will appear here.": "এই ব্যক্তির জন্য লেখা পরিশোধ এখানে দেখা যাবে।",
  Cleaner: "পরিচ্ছন্নতাকর্মী",
  Electrician: "ইলেকট্রিশিয়ান",
  Plumber: "প্লাম্বার",
  Manager: "ম্যানেজার",
  Cash: "নগদ",
  Bank: "ব্যাংক",

  // ---- accounts add-on ----
  "Accounts is an add-on": "হিসাব একটি অ্যাড-অন",
  "Contact us to enable Accounts": "হিসাব চালু করতে যোগাযোগ করুন",
  "Track your building's money — balances, income and expenses.":
    "আপনার ভবনের টাকার হিসাব রাখুন — ব্যালেন্স, আয় ও ব্যয়।",
  "Track your cash, bank and mobile-money balances — and every taka in and out.":
    "নগদ, ব্যাংক ও মোবাইল ব্যাংকিংয়ের ব্যালেন্স — আর প্রতিটি টাকার আয়-ব্যয়ের হিসাব রাখুন।",
  "No accounts yet": "এখনো কোনো হিসাব নেই",
  "Delete account?": "হিসাব মুছবেন?",
  "Total balance": "মোট ব্যালেন্স",
  "Opening balance": "প্রারম্ভিক ব্যালেন্স",
  "Cash in hand": "হাতে নগদ",
  "Mobile money": "মোবাইল ব্যাংকিং",
  Closed: "বন্ধ",
  Default: "ডিফল্ট",
  Auto: "স্বয়ংক্রিয়",
  "All months": "সব মাস",
  "All properties": "সব সম্পত্তি",
  "Select an account…": "একটি হিসাব নির্বাচন করুন…",
  "Choose an account.": "একটি হিসাব বেছে নিন।",
  "Choose both accounts.": "দুটি হিসাবই বেছে নিন।",
  "Choose two different accounts.": "দুটি ভিন্ন হিসাব বেছে নিন।",
  "No category": "কোনো ধরন নয়",
  "Type a category": "একটি ধরন লিখুন",
  "No property": "কোনো সম্পত্তি নয়",
  "Tie this entry to one of your properties.": "এই এন্ট্রিটি আপনার কোনো একটি সম্পত্তির সাথে যুক্ত করুন।",
  "No entries": "কোনো এন্ট্রি নেই",
  "Entry deleted.": "এন্ট্রি মুছে ফেলা হয়েছে।",
  "Delete entry?": "এন্ট্রি মুছবেন?",
  "This removes it permanently.": "এটি স্থায়ীভাবে মুছে যাবে।",
  "No income or expenses match this filter. Record one with the Income or Expense button above.":
    "এই ফিল্টারে কোনো আয় বা ব্যয় নেই। উপরের আয় বা ব্যয় বোতাম দিয়ে একটি লিখুন।",
  Transfer: "স্থানান্তর",
  "Transfer between accounts": "হিসাবের মধ্যে স্থানান্তর",
  "Transfer deleted.": "স্থানান্তর মুছে ফেলা হয়েছে।",
  "Delete transfer?": "স্থানান্তর মুছবেন?",
  "Move money without counting it as income or expense": "আয় বা ব্যয় হিসেবে না ধরে টাকা সরান",
  "Enter an amount greater than zero.": "শূন্যের চেয়ে বড় একটি পরিমাণ লিখুন।",
  "A name is required.": "একটি নাম দিতে হবে।",
  "Anything worth remembering": "মনে রাখার মতো কিছু",
  "Anything worth remembering (account number, holder…)": "মনে রাখার মতো কিছু (হিসাব নম্বর, নাম…)",
  "e.g. City Bank, bKash, Cash box": "যেমন: সিটি ব্যাংক, বিকাশ, ক্যাশ বাক্স",
  "e.g. Grand Crimson Holdings": "যেমন: গ্র্যান্ড ক্রিমসন হোল্ডিংস",
  "e.g. moved cash to bank": "যেমন: নগদ থেকে ব্যাংকে নেওয়া হয়েছে",
  "e.g. Extra charge is for the shared water-tank repair.":
    "যেমন: অতিরিক্ত চার্জটি যৌথ পানির ট্যাংক মেরামতের জন্য।",
  "Leave blank if they cover everything.": "সব কিছু দেখলে ফাঁকা রাখুন।",
  Deposit: "জামানত",
  Advance: "অগ্রিম",
  Salary: "বেতন",
  Utility: "ইউটিলিটি",
  Repair: "মেরামত",
  Tax: "কর",
  Supplies: "সরবরাহ",

  // ---- reset password ----
  "Verifying your reset link…": "আপনার রিসেট লিংক যাচাই করা হচ্ছে…",
  "Password updated": "পাসওয়ার্ড হালনাগাদ হয়েছে",
  "You can now sign in with your new password.": "এখন নতুন পাসওয়ার্ড দিয়ে সাইন ইন করতে পারবেন।",
  "Choose a new password": "নতুন পাসওয়ার্ড দিন",
  "Enter and confirm your new password below.": "নিচে নতুন পাসওয়ার্ড লিখে নিশ্চিত করুন।",

  // ---- update gate ----
  "Update available": "হালনাগাদ পাওয়া গেছে",
  "Bug fixes and improvements.": "ত্রুটি সংশোধন ও উন্নয়ন।",
  "Could not download the update. Opening the download page instead.":
    "হালনাগাদটি নামানো যায়নি। এর বদলে ডাউনলোড পাতা খোলা হচ্ছে।",

  // ---- printable receipt (lib/receipt.ts) ----
  // Single words here because the receipt builds its rows as "${label}:" — the colon is added by
  // the template, so the key must not carry one.
  "MONEY RECEIPT": "টাকা প্রাপ্তির রসিদ",
  "Money Receipt": "টাকা প্রাপ্তির রসিদ",
  PAID: "পরিশোধিত",
  PARTIAL: "আংশিক",
  DUE: "বকেয়া",
  LATE: "বিলম্বিত",
  "Total Paid": "মোট পরিশোধিত",
  "Total Due": "মোট বকেয়া",
  "Balance Due": "বকেয়া",
  "Tenant Name": "ভাড়াটিয়ার নাম",
  // The party row's label on a building service-charge receipt, which is made out to a flat
  // owner rather than a tenant. Not enforced by check-i18n (it is passed in from the English-only
  // building console) but the receipt itself leaves the app, so it is translated anyway.
  "Flat Owner": "ফ্ল্যাট মালিক",
  "House Rent": "বাড়ি ভাড়া",
  "Service Charge": "সার্ভিস চার্জ",
  "Extra Charge": "অতিরিক্ত চার্জ",
  Ref: "রেফ",
  "Landlord’s Signature": "বাড়িওয়ালার স্বাক্ষর",
  "Note: Please pay the rent by or on the {0} of the month.":
    "নোট: অনুগ্রহ করে মাসের {0} তারিখের মধ্যে ভাড়া পরিশোধ করুন।",
  "Note: Please pay the rent by or on the due date of the month.":
    "নোট: অনুগ্রহ করে মাসের নির্ধারিত তারিখের মধ্যে ভাড়া পরিশোধ করুন।",
  // ---- add-on names and native file save (lib/addons.ts, lib/native-file.ts) ----
  "Staff management": "স্টাফ ব্যবস্থাপনা",
  "Accounts & bookkeeping": "হিসাব ও খতিয়ান",
  included: "অন্তর্ভুক্ত",
  "Receipt saved to": "রসিদ সংরক্ষিত হয়েছে",
  documents: "ডকুমেন্টস",
  "app storage": "অ্যাপ স্টোরেজ",
  // ---- subscription lifecycle notice bodies (see lib/notice-i18n.ts TEMPLATES) ----
  "Your {0} plan expires in {1} days. Renew now to keep everything as it is.":
    "আপনার {0} প্ল্যানের মেয়াদ {1} দিনে শেষ হবে। সবকিছু আগের মতো রাখতে এখনই নবায়ন করুন।",
  "Your {0} plan has expired. You have {1} days left to renew before your account moves to the free plan.":
    "আপনার {0} প্ল্যানের মেয়াদ শেষ হয়েছে। ফ্রি প্ল্যানে যাওয়ার আগে নবায়নের জন্য আর {1} দিন সময় আছে।",
  "Your {0} plan has ended and you are now on the free plan — {1} properties and {2} tenants. Nothing has been deleted; anything beyond those limits is view-only until you choose a plan.":
    "আপনার {0} প্ল্যান শেষ হয়েছে এবং আপনি এখন ফ্রি প্ল্যানে আছেন — {1}টি সম্পত্তি ও {2} জন ভাড়াটিয়া। কোনো তথ্য মুছে ফেলা হয়নি; সীমার বাইরের সবকিছু নতুন প্ল্যান না নেওয়া পর্যন্ত শুধু দেখা যাবে।",

  // ---- the PUBLIC pricing page (app/plans/page.tsx) + its contact modal ----
  // Read by people who have not signed up, so it is the first Bangla most visitors ever see.
  // ⚠️ check-i18n CANNOT see the two CTA captions: they sit inside a ternary
  // ({price > 0 ? "Sign up" : "Start free"}) that the scanner does not evaluate. Listed here
  // by hand — renaming either in the page silently reverts it to English.
  "Plans & pricing": "প্ল্যান ও মূল্য",
  "Start free. Pay only when your portfolio grows.": "ফ্রি দিয়ে শুরু করুন। আপনার সম্পত্তি বাড়লে তবেই খরচ।",
  "Every plan includes the full dashboard — properties, tenants, rent invoices, receipts, maintenance and notices. Plans differ in how many properties and tenants you can manage, and which extra modules are bundled.":
    "প্রতিটি প্ল্যানেই পুরো ড্যাশবোর্ড রয়েছে — সম্পত্তি, ভাড়াটিয়া, ভাড়ার বিল, রসিদ, রক্ষণাবেক্ষণ ও নোটিশ। প্ল্যানভেদে কেবল সম্পত্তি ও ভাড়াটিয়ার সংখ্যা এবং অতিরিক্ত মডিউলগুলো আলাদা।",
  "Sign up": "সাইন আপ করুন",
  "Start free": "ফ্রিতে শুরু করুন",
  "Sign up with us": "আমাদের সঙ্গে সাইন আপ করুন",
  "See plans": "প্ল্যান দেখুন",
  "Free": "ফ্রি",
  "Up to": "সর্বোচ্চ",
  "Unlimited properties": "সীমাহীন সম্পত্তি",
  "Unlimited tenants": "সীমাহীন ভাড়াটিয়া",
  "Unlimited properties & tenants": "সীমাহীন সম্পত্তি ও ভাড়াটিয়া",
  "Custom build for your entire building": "আপনার পুরো ভবনের জন্য বিশেষভাবে তৈরি",
  "1 year free maintenance included": "১ বছরের ফ্রি রক্ষণাবেক্ষণ অন্তর্ভুক্ত",
  "Monthly or yearly contract from year 2": "দ্বিতীয় বছর থেকে মাসিক বা বাৎসরিক চুক্তি",
  "One-time plan — can't be renewed": "এককালীন প্ল্যান — নবায়ন করা যাবে না",
  "Pricing is not available right now. Please get in touch and we will send it to you.":
    "এই মুহূর্তে মূল্যতালিকা দেখানো যাচ্ছে না। যোগাযোগ করুন, আমরা আপনাকে পাঠিয়ে দেব।",
  "Paid plans are activated after we confirm your payment. The free plan never expires. Prices are in Bangladeshi Taka and include any discount currently offered.":
    "পেমেন্ট নিশ্চিত হওয়ার পর পেইড প্ল্যান চালু হয়। ফ্রি প্ল্যানের মেয়াদ কখনো শেষ হয় না। মূল্য বাংলাদেশি টাকায় এবং চলতি ছাড় ধরা আছে।",
  "Enquiry about the": "যে প্ল্যান সম্পর্কে জানতে চান",
  "I'm interested in the {plan} plan. Please get in touch.": "আমি {plan} প্ল্যানে আগ্রহী। অনুগ্রহ করে যোগাযোগ করুন।",
  "Leave an email address or a phone number so we can reply.": "উত্তর দেওয়ার জন্য একটি ইমেইল বা ফোন নম্বর দিন।",
  "Please leave an email address or a phone number so we can reply.": "অনুগ্রহ করে উত্তর দেওয়ার জন্য একটি ইমেইল বা ফোন নম্বর দিন।",

  // ---- the service-charge cutting sheet (lib/service-charge-sheet.ts) ----
  // Printed, cut up and handed to residents on paper, so it must not revert to English.
  "Service Charge Receipt": "সার্ভিস চার্জ রসিদ",
  "Service Charge Receipts": "সার্ভিস চার্জ রসিদসমূহ",
  "Building Copy": "ভবনের কপি",
  "Resident Copy": "বাসিন্দার কপি",
};
