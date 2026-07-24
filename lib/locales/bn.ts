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
  "Welcome to RentMaster!": "রেন্টমাস্টারে স্বাগতম!",
  "Reset your password": "পাসওয়ার্ড রিসেট করুন",
  "We'll email you a secure link to set a new password.":
    "নতুন পাসওয়ার্ড তৈরি করার জন্য আমরা আপনাকে একটি নিরাপদ লিংক ইমেইল করব।",
  "Account email": "অ্যাকাউন্টের ইমেইল",
  "Send reset link": "রিসেট লিংক পাঠান",
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
  "Change password": "পাসওয়ার্ড পরিবর্তন",
  "Update the password you use to sign in.": "সাইন ইন করার পাসওয়ার্ড পরিবর্তন করুন।",
  "Current password": "বর্তমান পাসওয়ার্ড",
  "New password": "নতুন পাসওয়ার্ড",
  "Confirm new password": "নতুন পাসওয়ার্ড নিশ্চিত করুন",
  "Update password": "পাসওয়ার্ড হালনাগাদ করুন",
  "Password updated.": "পাসওয়ার্ড হালনাগাদ হয়েছে।",
  "New passwords do not match.": "নতুন পাসওয়ার্ড দুটি মিলছে না।",
  "New password must be at least 8 characters.": "নতুন পাসওয়ার্ড কমপক্ষে ৮টি অক্ষরের হতে হবে।",
  "Your profile and this device's preferences.": "আপনার প্রোফাইল ও এই ডিভাইসের পছন্দসমূহ।",
  "System preferences for your account.": "আপনার অ্যাকাউন্টের সেটিংস।",

  // ---------------------------------------------------------------- maintenance gate
  "System under maintenance": "সিস্টেম রক্ষণাবেক্ষণে আছে",
  "Maintenance window": "রক্ষণাবেক্ষণের সময়",
  "Continue to sign in": "সাইন ইন করতে এগিয়ে যান",

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

  // ---------------------------------------------------------------- statuses
  paid: "পরিশোধিত",
  unpaid: "অপরিশোধিত",
  sent: "পাঠানো হয়েছে",
  low: "কম",
  medium: "মাঝারি",
  high: "বেশি",
  urgent: "জরুরি",
};
