// Lightweight translation dictionary for the patient-facing prototype.
// Keeps copy translation-key-ready without pulling in next-intl yet;
// swap this module for next-intl/next-i18next when wiring the real backend.

import type { Locale } from "./types";

export const locales: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "sw", label: "Kiswahili" },
];

const dict = {
  site_title: {
    en: "Afya24 - Talk to a doctor in minutes",
    sw: "Afya24 - Ongea na daktari kwa dakika chache",
  },
  site_description: {
    en: "Afya24 is a direct-pay telehealth platform: describe your issue, get matched with a licensed doctor, and consult by chat, voice, or video.",
    sw: "Afya24 ni jukwaa la matibabu ya mtandaoni la kulipa moja kwa moja: eleza tatizo lako, upangiwe daktari mwenye leseni, kisha uongee naye kwa ujumbe, sauti, au video.",
  },
  brand_tagline: {
    en: "Talk to a doctor in minutes",
    sw: "Ongea na daktari kwa dakika chache",
  },
  availability_next: {
    en: "Next available",
    sw: "Anayepatikana ijayo",
  },
  private_secure_badge: {
    en: "Private & secure",
    sw: "Faragha na usalama",
  },
  home_input_placeholder: {
    en: "What would you like help with?",
    sw: "Unahitaji msaada gani?",
  },
  start_assessment_cta: {
    en: "Start assessment",
    sw: "Anza tathmini",
  },
  reference_lookup_link: {
    en: "Enter your reference number",
    sw: "Weka nambari yako ya rejea",
  },
  health_tips_title: {
    en: "Health tips & info",
    sw: "Vidokezo vya afya",
  },
  back_to_home: {
    en: "Back to home",
    sw: "Rudi mwanzo",
  },
  error_page_title: {
    en: "Something went wrong",
    sw: "Hitilafu imetokea",
  },
  error_page_body: {
    en: "That didn't go through. Please try again, or head back to the home page.",
    sw: "Hatua hiyo haikukamilika. Tafadhali jaribu tena, au rudi kwenye ukurasa wa mwanzo.",
  },
  error_page_retry: {
    en: "Try again",
    sw: "Jaribu tena",
  },
  hero_headline_prefix: {
    en: "Healthcare, made",
    sw: "Huduma za afya, kwa",
  },
  hero_title_fast: { en: "fast", sw: "haraka" },
  hero_title_private: { en: "private", sw: "faragha" },
  hero_title_affordable: { en: "affordable", sw: "bei nafuu" },
  hero_title_simple: { en: "simple", sw: "rahisi" },
  hero_title_convenient: { en: "convenient", sw: "urahisi" },
  hero_get_help_cta: { en: "See a doctor now", sw: "Ona daktari sasa" },
  how_it_works_step1_title: {
    en: "Explain your issue to Afya24",
    sw: "Eleza tatizo lako kwa Afya24",
  },
  how_it_works_step1_body: {
    en: "Describe what's happening in your own words. Afya24 asks a few safe follow-up questions.",
    sw: "Eleza kinachoendelea kwa maneno yako mwenyewe. Afya24 itakuuliza maswali machache ya ziada kwa usalama.",
  },
  how_it_works_step2_title: {
    en: "Get matched to suitable doctors",
    sw: "Upangiwe madaktari wanaofaa",
  },
  how_it_works_step2_body: {
    en: "See doctors by specialty, price, language, and availability, based on what you described.",
    sw: "Ona madaktari kulingana na utaalamu, bei, lugha, na upatikanaji, kutegemea ulichoeleza.",
  },
  how_it_works_step3_title: {
    en: "Choose chat, voice, or video",
    sw: "Chagua ujumbe, sauti, au video",
  },
  how_it_works_step3_body: {
    en: "Book now or for later, then talk to your doctor however feels most comfortable.",
    sw: "Weka miadi sasa au baadaye, kisha ongea na daktari wako kwa njia unayoipenda zaidi.",
  },
  how_it_works_step4_title: {
    en: "Receive your outcome",
    sw: "Pokea matokeo yako",
  },
  how_it_works_step4_body: {
    en: "A prescription, pharmacy handoff, lab referral, or signed visit summary, doctor-approved.",
    sw: "Dawa, upitishaji wa dawa kwa duka la dawa, rufaa ya maabara, au muhtasari wa ziara uliosainiwa, ulioidhinishwa na daktari.",
  },
  how_it_works_cta: {
    en: "Start now",
    sw: "Muone daktari",
  },
  trust_section_title: {
    en: "Built for clinical trust",
    sw: "Imejengwa kwa uaminifu wa kitabibu",
  },
  trust_section_badge: {
    en: "Your health. In safe hands.",
    sw: "Afya yako. Mikononi salama.",
  },
  trust_section_body: {
    en: "Afya24 is designed with care, transparency, and safety at its core, so every patient knows what happens before speaking to a doctor.",
    sw: "Afya24 imeundwa kwa uangalifu, uwazi, na usalama ili kila mgonjwa aelewe kinachofuata kabla ya kuongea na daktari.",
  },
  trust_section_footer: {
    en: "At Afya24, your trust is our foundation. We combine technology with human care to deliver a safe, supportive, and reliable healthcare experience.",
    sw: "Afya24, uaminifu wako ndio msingi wetu. Tunaunganisha teknolojia na huduma ya kibinadamu ili kutoa uzoefu salama, wenye msaada, na wa kuaminika.",
  },
  trust_point1_title: { en: "Licensed doctors", sw: "Madaktari wenye leseni" },
  trust_point1_body: {
    en: "Every provider on Afya24 is a licensed, credentialed clinician.",
    sw: "Kila daktari kwenye Afya24 ana leseni na sifa zinazothibitishwa.",
  },
  trust_point2_title: { en: "Afya24 assists, never diagnoses", sw: "Afya24 husaidia, haifanyi uchunguzi" },
  trust_point2_body: {
    en: "Afya24 summarizes and routes. Diagnosis and treatment decisions stay with your doctor.",
    sw: "Afya24 hufupisha na kuelekeza. Maamuzi ya uchunguzi na matibabu hubaki kwa daktari wako.",
  },
  trust_point4_title: { en: "Secure patient records", sw: "Rekodi salama za mgonjwa" },
  trust_point4_body: {
    en: "Your medical file is private and only visible to doctors involved in your care.",
    sw: "Faili lako la matibabu ni la faragha na huonekana tu na madaktari wanaohusika na huduma yako.",
  },
  trust_point5_title: { en: "Clear emergency boundaries", sw: "Mipaka wazi ya dharura" },
  trust_point5_body: {
    en: "We tell you plainly when a symptom needs in-person or emergency care instead of a virtual visit.",
    sw: "Tunakuambia wazi wakati dalili inahitaji huduma ya ana kwa ana au dharura badala ya ziara ya mtandaoni.",
  },
  services_title: { en: "Services", sw: "Huduma" },
  services_subtitle: {
    en: "Choose a care type and Afya24 will guide you to the right doctor.",
    sw: "Chagua aina ya huduma na Afya24 itakuongoza kwa daktari sahihi.",
  },
  services_feature_title: { en: "Find the right care", sw: "Pata huduma sahihi" },
  returning_patient_title: { en: "Returning patient?", sw: "Uliwahi kuwa mgonjwa wetu?" },
  returning_patient_body: {
    en: "Use your reference number to view appointments, prescriptions, lab referrals, or signed summaries. Or",
    sw: "Tumia nambari yako ya rejea kuona miadi, dawa, rufaa za maabara, au muhtasari zilizosainiwa. Au",
  },
  returning_patient_sign_in: { en: "sign in", sw: "ingia" },
  returning_patient_if_account: {
    en: "if you have an account.",
    sw: "kama una akaunti.",
  },
  returning_patient_lookup_cta: { en: "Look up", sw: "Tafuta" },
  returning_patient_new_here: {
    en: "New here? Create an account instead",
    sw: "Mgeni hapa? Fungua akaunti badala yake",
  },
  reviews_kicker: {
    en: "Those who choose Afya24",
    sw: "Wanaochagua Afya24",
  },
  reviews_medvi_title: {
    en: "There is a reason patients are",
    sw: "Kuna sababu wagonjwa",
  },
  reviews_medvi_title_accent: {
    en: "trusting us",
    sw: "wanatuamini",
  },
  reviews_medvi_body: {
    en: "Real patient stories, clear care, and trusted next steps.",
    sw: "Hadithi halisi za wagonjwa, huduma iliyo wazi, na hatua zinazofuata za kuaminika.",
  },
  reviews_role_mother: { en: "Patient account, mother", sw: "Akaunti ya mgonjwa, mama" },
  reviews_role_patient: { en: "Patient account", sw: "Akaunti ya mgonjwa" },
  reviews_role_parent: { en: "Patient account, parent", sw: "Akaunti ya mgonjwa, mzazi" },
  reviews_quote_1: {
    en: "The doctor joined quickly and explained what to watch for. I liked seeing the summary before the visit ended.",
    sw: "Daktari aliingia haraka na akaeleza cha kuangalia. Nilipenda kuona muhtasari kabla ziara haijaisha.",
  },
  reviews_quote_2: {
    en: "The AI questions helped me explain my symptoms clearly before speaking to the doctor.",
    sw: "Maswali ya AI yalinisaidia kueleza dalili zangu vizuri kabla ya kuongea na daktari.",
  },
  reviews_quote_3: {
    en: "I got the prescription instructions and visit notes in one place. It felt organized and calm.",
    sw: "Nilipata maelekezo ya dawa na maelezo ya ziara sehemu moja. Ilikuwa imepangiliwa vizuri.",
  },
  reviews_quote_4: {
    en: "Booking was simple, and the doctor spoke in a way I could understand without pressure.",
    sw: "Kuweka miadi ilikuwa rahisi, na daktari alieleza kwa lugha niliyoielewa bila presha.",
  },
  reviews_quote_5: {
    en: "For my child, the questions were clear and the doctor told us exactly when to seek urgent care.",
    sw: "Kwa mtoto wangu, maswali yalikuwa wazi na daktari alituambia lini tutafute huduma ya haraka.",
  },
  reviews_quote_6: {
    en: "I could check my records later with my reference number. That made follow-up easier.",
    sw: "Niliweza kuangalia rekodi zangu baadaye kwa nambari ya rejea. Hilo lilirahisisha ufuatiliaji.",
  },
  email_capture_badge: { en: "Stay in the loop", sw: "Endelea kufahamu" },
  email_capture_title: { en: "Get health tips and updates", sw: "Pata vidokezo vya afya na taarifa" },
  email_capture_body: {
    en: "Occasional emails about new doctors, services, and ways to get care faster. No spam.",
    sw: "Barua pepe za mara kwa mara kuhusu madaktari wapya, huduma, na njia za kupata matibabu haraka. Bila taka.",
  },
  email_capture_success: { en: "You're on the list.", sw: "Umeongezwa kwenye orodha." },
  email_capture_joining: { en: "Joining...", sw: "Inaunga..." },
  email_capture_subscribe: { en: "Subscribe", sw: "Jiunge" },
  health_tip1_title: { en: "When fever needs urgent care", sw: "Wakati homa inahitaji uangalizi wa haraka" },
  health_tip1_teaser: {
    en: "Most fevers settle with rest and fluids, but a few signs mean you shouldn't wait to see a doctor.",
    sw: "Homa nyingi hupungua kwa kupumzika na kunywa maji, lakini dalili chache zinamaanisha usisubiri kuonana na daktari.",
  },
  health_tip2_title: {
    en: "Preparing for your video consultation",
    sw: "Kujiandaa kwa ushauri wako wa video",
  },
  health_tip2_teaser: {
    en: "A quiet, well-lit spot and a few notes on your symptoms make the visit go faster.",
    sw: "Sehemu tulivu, yenye mwanga mzuri, na maandishi machache kuhusu dalili zako hufanya ziara iende haraka.",
  },
  health_tips_coming_soon: { en: "Coming soon", sw: "Inakuja hivi karibuni" },
  health_tips_editorial_eyebrow: {
    en: "Better health, better life",
    sw: "Afya bora, maisha bora",
  },
  health_tips_editorial_subtitle: {
    en: "Expert guidance. Better everyday health.",
    sw: "Ushauri wa kitaalamu. Maisha bora kila siku.",
  },
  email_capture_enter_email_error: { en: "Enter an email address.", sw: "Weka anwani ya barua pepe." },
  email_capture_generic_error: {
    en: "Something went wrong. Try again.",
    sw: "Hitilafu imetokea. Jaribu tena.",
  },
  doctors_preview_title: { en: "Doctors ready to help", sw: "Madaktari tayari kusaidia" },
  doctors_preview_subtitle: {
    en: "Real prices, clear availability, and the language you prefer.",
    sw: "Bei halisi, upatikanaji wazi, na lugha unayopendelea.",
  },
  doctors_preview_see_all: { en: "See all doctors", sw: "Ona madaktari wote" },
  doctors_preview_prev: { en: "Previous doctor", sw: "Daktari aliyetangulia" },
  doctors_preview_next: { en: "Next doctor", sw: "Daktari anayefuata" },
  labs_title: { en: "Partner labs near you", sw: "Maabara washirika karibu nawe" },
  labs_geo_unavailable: {
    en: "Location isn't available in this browser.",
    sw: "Huduma ya eneo haipatikani kwenye kivinjari hiki.",
  },
  labs_geo_error: {
    en: "Couldn't get your location. Check your browser's location permission.",
    sw: "Imeshindwa kupata eneo lako. Angalia ruhusa ya eneo kwenye kivinjari chako.",
  },
  labs_find_closest_title: { en: "Find the labs closest to you", sw: "Tafuta maabara zilizo karibu nawe" },
  labs_find_closest_body: {
    en: "We only search once you ask. Share your location to see the {n} nearest partner labs, with maps and directions.",
    sw: "Tunatafuta tu ukiuliza. Shiriki eneo lako kuona maabara washirika {n} zilizo karibu zaidi, pamoja na ramani na maelekezo.",
  },
  labs_privacy_note: {
    en: "Your privacy matters. Your location is only used to find nearby labs and is never stored.",
    sw: "Faragha yako ni muhimu. Eneo lako hutumika tu kutafuta maabara zilizo karibu na halihifadhiwi.",
  },
  labs_finding_you: { en: "Finding you...", sw: "Tunatafuta eneo lako..." },
  labs_find_near_me: { en: "Find labs near me", sw: "Tafuta maabara karibu nami" },
  labs_search_again: { en: "Search again", sw: "Tafuta tena" },
  labs_away_meters: { en: "m away", sw: "m mbali" },
  labs_away_km: { en: "km away", sw: "km mbali" },
  labs_open_maps: { en: "Open in Maps", sw: "Fungua kwenye Ramani" },
  pharmacy_cat_all: { en: "All", sw: "Zote" },
  pharmacy_cat_pain_relief: { en: "Pain relief", sw: "Kupunguza maumivu" },
  pharmacy_cat_allergy: { en: "Allergy", sw: "Mzio" },
  pharmacy_cat_antibiotics: { en: "Antibiotics", sw: "Viua vijasumu" },
  pharmacy_cat_vitamins: { en: "Vitamins & supplements", sw: "Vitamini na virutubisho" },
  pharmacy_cat_supplements: { en: "Supplements", sw: "Virutubisho" },
  pharmacy_cat_hospital_tools: { en: "Hospital tools", sw: "Vifaa vya hospitali" },
  pharmacy_cat_medical_devices: { en: "Medical devices", sw: "Vifaa vya matibabu" },
  pharmacy_cat_wound_care: { en: "Wound care", sw: "Huduma ya vidonda" },
  pharmacy_cat_first_aid: { en: "First aid", sw: "Huduma ya kwanza" },
  pharmacy_cat_cold_flu: { en: "Cold & flu", sw: "Mafua na homa" },
  pharmacy_cat_chronic: { en: "Chronic condition", sw: "Hali sugu" },
  pharmacy_stock_in: { en: "In stock", sw: "Ipo" },
  pharmacy_stock_low: { en: "Low stock", sw: "Inapungua" },
  pharmacy_stock_out: { en: "Out", sw: "Imeisha" },
  pharmacy_order_pending: { en: "Pending", sw: "Inasubiri" },
  pharmacy_order_preparing: { en: "Preparing", sw: "Inaandaliwa" },
  pharmacy_order_ready: { en: "Ready", sw: "Tayari" },
  pharmacy_order_delivery: { en: "Delivery", sw: "Inasafirishwa" },
  pharmacy_order_done: { en: "Done", sw: "Imekamilika" },
  pharmacy_preview_label: {
    en: "Afya24 pharmacy",
    sw: "Duka la dawa Afya24",
  },
  pharmacy_preview_title_accent: {
    en: "Stock",
    sw: "Pata",
  },
  pharmacy_preview_title_rest: {
    en: "your care essentials with confidence",
    sw: "bidhaa zako za afya kwa uhakika",
  },
  pharmacy_preview_supplements_card: {
    en: "Supplements and daily wellness",
    sw: "Virutubisho na afya ya kila siku",
  },
  pharmacy_preview_supplements_body: {
    en: "Everyday support for energy, immunity, and recovery.",
    sw: "Msaada wa kila siku kwa nguvu, kinga, na kupona.",
  },
  pharmacy_preview_medicine_card: {
    en: "Medicine when you need it",
    sw: "Dawa unapozihitaji",
  },
  pharmacy_preview_medicine_body: {
    en: "Doctor-linked prescriptions and trusted essentials.",
    sw: "Dawa zilizounganishwa na daktari pamoja na bidhaa muhimu.",
  },
  pharmacy_preview_open_cta: { en: "Open pharmacy", sw: "Fungua duka la dawa" },
  nav_how_it_works: { en: "How it works", sw: "Jinsi inavyofanya kazi" },
  nav_doctors: { en: "Doctors", sw: "Madaktari" },
  nav_pharmacy: { en: "Pharmacy", sw: "Duka la dawa" },
  nav_labs: { en: "Labs", sw: "Maabara" },
  nav_health_tips: { en: "Health tips", sw: "Vidokezo vya afya" },
  header_doctor_admin_login: { en: "Staff login", sw: "Kuingia kwa wafanyakazi" },
  header_sign_up: { en: "Sign up", sw: "Jisajili" },
  header_log_in: { en: "Log in", sw: "Ingia" },
  header_my_account: { en: "My account", sw: "Akaunti yangu" },
  header_log_out: { en: "Log out", sw: "Toka" },
  header_help: { en: "Help", sw: "Msaada" },
  header_search_aria: { en: "Search for care", sw: "Tafuta huduma" },
  header_search_placeholder: {
    en: "Search doctors or specialties",
    sw: "Tafuta madaktari au utaalamu",
  },
  header_search_close_aria: { en: "Close search", sw: "Funga utafutaji" },
  header_open_menu_aria: { en: "Open menu", sw: "Fungua menyu" },
  footer_tagline: {
    en: "Direct-pay telehealth. Tell Afya24 what's going on first, then see a licensed doctor by chat, voice, or video.",
    sw: "Matibabu ya mtandaoni ya kulipa moja kwa moja. Mwambie Afya24 kinachoendelea kwanza, kisha uonane na daktari mwenye leseni kwa ujumbe, sauti, au video.",
  },
  footer_quick_links: { en: "Quick links", sw: "Viungo vya haraka" },
  footer_patient_support: { en: "Patient support", sw: "Msaada kwa mgonjwa" },
  footer_find_my_visit: { en: "Find my visit", sw: "Tafuta ziara yangu" },
  footer_help_center: { en: "Help center", sw: "Kituo cha msaada" },
  footer_contact_support: { en: "Contact support", sw: "Wasiliana na msaada" },
  footer_for_providers: { en: "For providers", sw: "Kwa watoa huduma" },
  footer_join_provider: { en: "Join as a provider", sw: "Jiunge kama mtoa huduma" },
  footer_all_rights: { en: "All rights reserved.", sw: "Haki zote zimehifadhiwa." },
  footer_privacy_policy: { en: "Privacy policy", sw: "Sera ya faragha" },
  footer_terms: { en: "Terms", sw: "Vigezo" },
  footer_emergency_note: {
    en: "If this is an emergency, seek immediate in-person care now.",
    sw: "Ikiwa hii ni dharura, tafuta huduma ya haraka ya ana kwa ana sasa hivi.",
  },
  account_welcome_back: { en: "Welcome back", sw: "Karibu tena" },
  account_login_title: { en: "Log in to your account", sw: "Ingia kwenye akaunti yako" },
  account_phone_placeholder: { en: "Phone number", sw: "Nambari ya simu" },
  account_password_placeholder: { en: "Password", sw: "Nenosiri" },
  account_new_to_afya24: { en: "New to Afya24?", sw: "Mgeni Afya24?" },
  account_create_account_link: { en: "Create an account", sw: "Fungua akaunti" },
  account_prefer_lookup: { en: "Prefer not to sign up? Use", sw: "Hupendi kujisajili? Tumia" },
  account_reference_lookup_phrase: {
    en: "reference number lookup",
    sw: "utafutaji wa nambari ya rejea",
  },
  account_instead: { en: "instead.", sw: "badala yake." },
  account_signup_title: {
    en: "Fast, upfront healthcare starts here",
    sw: "Huduma za afya za haraka, kwa bei wazi, huanzia hapa",
  },
  account_signup_body: {
    en: "Create your account. It only takes a minute, and keeps your appointments, prescriptions, and visit summaries in one place.",
    sw: "Fungua akaunti yako. Inachukua dakika moja tu, na huhifadhi miadi, dawa, na muhtasari za ziara zako mahali pamoja.",
  },
  account_fullname_placeholder: { en: "Full name", sw: "Jina kamili" },
  account_phone_hint_placeholder: {
    en: "Phone number (e.g. +255712345678)",
    sw: "Nambari ya simu (mfano +255712345678)",
  },
  account_phone_hint_title: {
    en: "Include your country code, e.g. +255712345678",
    sw: "Jumuisha nambari ya nchi, mfano +255712345678",
  },
  account_agree_prefix: { en: "I agree to the", sw: "Nakubali" },
  account_terms_of_service_link: { en: "Terms of Service", sw: "Vigezo vya Huduma" },
  account_and: { en: "and", sw: "na" },
  account_privacy_policy_link: { en: "Privacy Policy", sw: "Sera ya Faragha" },
  account_create_cta: { en: "Create account", sw: "Fungua akaunti" },
  account_already_customer: { en: "Already a customer?", sw: "Tayari ni mteja?" },
  account_benefit1: { en: "Upfront pricing before you book", sw: "Bei wazi kabla ya kuweka miadi" },
  account_benefit2: {
    en: "Chat, voice, or video with a licensed doctor",
    sw: "Ujumbe, sauti, au video na daktari mwenye leseni",
  },
  account_benefit3: {
    en: "Prescriptions and visit summaries in one place",
    sw: "Dawa na muhtasari za ziara mahali pamoja",
  },
  account_benefit4: {
    en: "Doctor-approved pharmacy checkout",
    sw: "Malipo ya duka la dawa yaliyoidhinishwa na daktari",
  },
  check_phone_title: { en: "Almost there", sw: "Karibu kumaliza" },
  check_phone_body: {
    en: "Your account was created, but phone verification is still pending. If you don't hear back shortly, try signing in directly.",
    sw: "Akaunti yako imeundwa, lakini uthibitishaji wa simu bado unasubiriwa. Kama hujapata jibu hivi karibuni, jaribu kuingia moja kwa moja.",
  },
  check_phone_back_to_signin: { en: "Back to sign in", sw: "Rudi kuingia" },
  dashboard_sign_out: { en: "Sign out", sw: "Toka" },
  dashboard_reference_prefix: { en: "Reference", sw: "Nambari ya rejea" },
  dashboard_appointments: { en: "Appointments", sw: "Miadi" },
  dashboard_no_appointments: { en: "No appointments on file yet.", sw: "Hakuna miadi bado." },
  appointment_status_scheduled: { en: "Scheduled", sw: "Imepangwa" },
  appointment_status_waiting: { en: "Waiting", sw: "Inasubiri" },
  appointment_status_in_progress: { en: "In progress", sw: "Inaendelea" },
  appointment_status_completed: { en: "Completed", sw: "Imekamilika" },
  appointment_status_cancelled: { en: "Cancelled", sw: "Imeghairiwa" },
  doctor_signin_title: { en: "Staff sign in", sw: "Kuingia kwa wafanyakazi" },
  doctor_signin_body: {
    en: "Staff and provider access only. Patients don't need an account — use",
    sw: "Ufikiaji wa wafanyakazi na watoa huduma pekee. Wagonjwa hawahitaji akaunti — tumia",
  },
  doctor_email_label: { en: "Email", sw: "Barua pepe" },
  doctor_sign_in_cta: { en: "Sign in", sw: "Ingia" },
  doctor_dashboard_role: { en: "Role", sw: "Wadhifa" },
  doctor_dashboard_status: { en: "Status", sw: "Hali" },
  doctor_dashboard_no_profile: {
    en: "No staff profile found for this account yet. Ask an admin to add a row for you in",
    sw: "Hakuna wasifu wa mfanyakazi bado kwa akaunti hii. Muombe msimamizi akuongeze kwenye",
  },
  doctor_dashboard_with_role: { en: "with your role.", sw: "na wadhifa wako." },
  role_admin: { en: "Admin", sw: "Msimamizi" },
  role_doctor: { en: "Doctor", sw: "Daktari" },
  role_pharmacy_staff: { en: "Pharmacy staff", sw: "Mfanyakazi wa duka la dawa" },
  role_lab_staff: { en: "Lab staff", sw: "Mfanyakazi wa maabara" },
  status_active: { en: "Active", sw: "Hai" },
  status_suspended: { en: "Suspended", sw: "Imesimamishwa" },
  status_invited: { en: "Invited", sw: "Amealikwa" },
  lookup_title: { en: "Find your visit", sw: "Tafuta ziara yako" },
  lookup_body: {
    en: "Enter your reference number and date of birth to view your appointments, prescriptions, and visit summaries.",
    sw: "Weka nambari yako ya rejea na tarehe ya kuzaliwa kuona miadi, dawa, na muhtasari za ziara zako.",
  },
  lookup_reference_label: { en: "Reference number", sw: "Nambari ya rejea" },
  lookup_dob_label: { en: "Date of birth", sw: "Tarehe ya kuzaliwa" },
  lookup_dob_day: { en: "Day", sw: "Siku" },
  lookup_dob_month: { en: "Month", sw: "Mwezi" },
  lookup_dob_year: { en: "Year", sw: "Mwaka" },
  lookup_submit_cta: { en: "Find my visit", sw: "Tafuta ziara yangu" },
  lookup_expired_title: {
    en: "This lookup session has expired",
    sw: "Kikao hiki cha utafutaji kimeisha muda",
  },
  lookup_expired_body: {
    en: "For your privacy, lookup sessions only last a few minutes. Please look yourself up again.",
    sw: "Kwa faragha yako, vikao vya utafutaji hudumu dakika chache tu. Tafadhali jitafute tena.",
  },
  lookup_back_to_lookup: { en: "Back to lookup", sw: "Rudi kutafuta" },
  lookup_end_session: { en: "End session", sw: "Maliza kikao" },
  lookup_join_call_cta: { en: "Join call", sw: "Jiunge na simu" },
  error_fill_all_fields: { en: "Fill in all fields.", sw: "Jaza sehemu zote." },
  error_must_agree_terms: {
    en: "You must agree to the Terms of Service and Privacy Policy.",
    sw: "Lazima ukubali Vigezo vya Huduma na Sera ya Faragha.",
  },
  error_account_creation_failed: {
    en: "Something went wrong creating your account.",
    sw: "Hitilafu imetokea wakati wa kuunda akaunti yako.",
  },
  error_enter_reference_dob: {
    en: "Enter your reference number and date of birth.",
    sw: "Weka nambari yako ya rejea na tarehe ya kuzaliwa.",
  },
  error_no_matching_record: {
    en: "We couldn't find a matching record. Check your reference number and date of birth.",
    sw: "Hatukuweza kupata rekodi inayolingana. Angalia nambari yako ya rejea na tarehe ya kuzaliwa.",
  },
  error_too_many_attempts: {
    en: "Too many attempts for this reference number. Please try again later.",
    sw: "Majaribio mengi sana kwa nambari hii ya rejea. Tafadhali jaribu tena baadaye.",
  },
  lookup_pin_label: { en: "PIN", sw: "PIN" },
  lookup_use_dob_instead: {
    en: "I don't have a PIN — use my date of birth",
    sw: "Sina PIN — tumia tarehe yangu ya kuzaliwa",
  },
  lookup_use_pin_instead: {
    en: "Use my PIN instead",
    sw: "Tumia PIN yangu badala yake",
  },
  error_confirm_link_invalid: {
    en: "That confirmation link is invalid or has expired.",
    sw: "Kiungo hicho cha uthibitisho si sahihi au kimeisha muda.",
  },
  doctors_page_title: { en: "All doctors", sw: "Madaktari wote" },
  doctors_page_body: {
    en: "{n} doctors available. Sorting and filtering by price, rating, and language are coming soon.",
    sw: "Madaktari {n} wanapatikana. Kupanga na kuchuja kwa bei, ukadiriaji, na lugha zinakuja hivi karibuni.",
  },
  doctors_page_search_results: {
    en: "{n} results for “{q}”",
    sw: "Matokeo {n} kwa “{q}”",
  },
  doctors_page_specialty_results: {
    en: "{n} doctors for {specialty}. Doctors available now are shown first.",
    sw: "Madaktari {n} wa {specialty}. Wanaopatikana sasa wanaonyeshwa kwanza.",
  },
  doctors_page_no_results: {
    en: "No doctors match your search. Try a different name or specialty.",
    sw: "Hakuna daktari anayelingana na utafutaji wako. Jaribu jina au utaalamu mwingine.",
  },
  doctors_page_specialty_fallback: {
    en: "No doctors listed under {specialty} yet, so here's everyone available. Doctors available now are shown first.",
    sw: "Hakuna madaktari wa {specialty} bado, kwa hivyo hawa ndio wote wanaopatikana. Wanaopatikana sasa wanaonyeshwa kwanza.",
  },
  doctor_card_from: { en: "From", sw: "Kuanzia" },
  doctor_card_view: { en: "View doctor", sw: "Ona daktari" },
  doctor_booking_back: { en: "Back to doctors", sw: "Rudi kwa madaktari" },
  doctor_booking_choose_mode: { en: "How would you like to connect?", sw: "Ungependa kuunganishwa vipi?" },
  doctor_booking_mode_voice: { en: "Voice call", sw: "Simu ya sauti" },
  doctor_booking_mode_video: { en: "Video call", sw: "Simu ya video" },
  doctor_booking_price_label: { en: "Consultation fee", sw: "Ada ya ushauri" },
  doctor_booking_confirm_cta: { en: "Start consultation", sw: "Anza ushauri" },
  doctor_booking_summary_note: {
    en: "Your Afya24 intake summary will be shared with the doctor.",
    sw: "Muhtasari wako wa Afya24 utashirikiwa na daktari.",
  },
  doctor_booking_error: {
    en: "We couldn't start your consultation. Please try again.",
    sw: "Hatukuweza kuanza ushauri wako. Tafadhali jaribu tena.",
  },
  doctor_booking_no_session_title: {
    en: "Start with Afya24 first",
    sw: "Anza na Afya24 kwanza",
  },
  doctor_booking_no_session_body: {
    en: "Booking needs a patient file. Describe what's going on to Afya24, or look yourself up if you're a returning patient, then come back to book.",
    sw: "Kuweka miadi kunahitaji faili la mgonjwa. Mwambie Afya24 kinachoendelea, au jitafute kama wewe ni mgonjwa wa zamani, kisha urudi kuweka miadi.",
  },
  pharmacy_checkout_no_session_body: {
    en: "Checkout needs a patient file. Describe what's going on to Afya24, or look yourself up if you're a returning patient, then come back to check out.",
    sw: "Malipo yanahitaji faili la mgonjwa. Mwambie Afya24 kinachoendelea, au jitafute kama wewe ni mgonjwa wa zamani, kisha urudi kulipa.",
  },
  doctor_lang_en: { en: "English", sw: "Kiingereza" },
  doctor_lang_sw: { en: "Swahili", sw: "Kiswahili" },
  doctor_available_now: { en: "Available now", sw: "Anapatikana sasa" },
  doctor_rating_new: { en: "New", sw: "Mpya" },
  doctor_check_back_later: { en: "Check back later", sw: "Angalia tena baadaye" },
  doctor_badge_available_today: { en: "Available today", sw: "Anapatikana leo" },
  doctor_badge_highly_rated: { en: "Highly rated", sw: "Anapendwa sana" },
  doctor_badge_loyal_patients: { en: "Loyal patients", sw: "Wagonjwa waaminifu" },
  doctor_carousel_more: { en: "More", sw: "Zaidi" },
  doctor_carousel_book_visit: { en: "Book visit", sw: "Weka miadi" },
  pharmacy_your_cart: { en: "Your cart", sw: "Kikapu chako" },
  pharmacy_cart_empty: {
    en: "Your cart is empty. Add an item from the catalog to get started.",
    sw: "Kikapu chako ni tupu. Ongeza bidhaa kutoka orodha ili kuanza.",
  },
  pharmacy_decrease_qty: { en: "Decrease quantity", sw: "Punguza idadi" },
  pharmacy_increase_qty: { en: "Increase quantity", sw: "Ongeza idadi" },
  pharmacy_remove_item: { en: "Remove item", sw: "Ondoa bidhaa" },
  pharmacy_subtotal: { en: "Subtotal", sw: "Jumla ndogo" },
  pharmacy_proceed_checkout: { en: "Proceed to checkout", sw: "Endelea kulipa" },
  pharmacy_cart_button: { en: "Cart", sw: "Kikapu" },
  pharmacy_search_medicines_placeholder: { en: "Search medicines...", sw: "Tafuta dawa..." },
  pharmacy_no_medicines_match: { en: "No medicines match", sw: "Hakuna dawa zinazolingana na" },
  pharmacy_catalog_empty_title: { en: "The pharmacy is opening soon", sw: "Duka la dawa linakaribia kufunguliwa" },
  pharmacy_catalog_empty_body: {
    en: "We're stocking the catalog. Check back shortly, or ask Afya24 about a prescription refill in the meantime.",
    sw: "Tunaandaa orodha ya bidhaa. Rudi hivi karibuni, au muulize Afya24 kuhusu kuongeza dawa wakati unasubiri.",
  },
  pharmacy_requires_rx: { en: "Requires Rx", sw: "Inahitaji Rx" },
  pharmacy_trending_title: { en: "Trending now", sw: "Zinazotafutwa zaidi" },
  pharmacy_trending_subtitle: {
    en: "Popular picks other patients are buying right now.",
    sw: "Bidhaa maarufu ambazo wagonjwa wengine wananunua sasa.",
  },
  pharmacy_badge_trending: { en: "Trending", sw: "Inatafutwa" },
  pharmacy_badge_hot: { en: "Hot", sw: "Moto" },
  pharmacy_badge_new: { en: "New", sw: "Mpya" },
  pharmacy_badge_sale: { en: "Sale", sw: "Ofa" },
  pharmacy_add_to_cart: { en: "Add to cart", sw: "Ongeza kwenye kikapu" },
  pharmacy_in_cart: { en: "In cart", sw: "Kwenye kikapu" },
  pharmacy_categories_title: { en: "Shop by category", sw: "Nunua kwa aina" },
  pharmacy_topbar_name: { en: "Afya24 pharmacy", sw: "Duka la dawa la Afya24" },
  pharmacy_topbar_tagline: {
    en: "Medical supplies, supplements, and prescription fulfillment",
    sw: "Bidhaa za matibabu, virutubisho, na utoaji wa dawa",
  },
  pharmacy_topbar_support: { en: "Support 24/7", sw: "Msaada saa 24/7" },
  pharmacy_hero_subtitle: {
    en: "Shop trusted medicines, supplements, wound care, and hospital tools from Afya24 pharmacy.",
    sw: "Nunua dawa za kuaminika, virutubisho, huduma za majeraha, na vifaa vya hospitali kutoka duka la dawa la Afya24.",
  },
  pharmacy_price_label: { en: "Price", sw: "Bei" },
  pharmacy_stock_out_full: { en: "Out of stock", sw: "Imeisha stoo" },
  pharmacy_status_ready_full: { en: "Ready for pickup", sw: "Tayari kuchukuliwa" },
  pharmacy_status_delivery_full: { en: "Out for delivery", sw: "Inasafirishwa" },
  pharmacy_status_delivered_full: { en: "Delivered", sw: "Imefikishwa" },
  checkout_order_placed: { en: "Order placed", sw: "Agizo limewekwa" },
  checkout_order_received: {
    en: "We've received your order. You can track its status below.",
    sw: "Tumepokea agizo lako. Unaweza kufuatilia hali yake hapa chini.",
  },
  checkout_cart_empty_title: { en: "Your cart is empty", sw: "Kikapu chako ni tupu" },
  checkout_cart_empty_body: {
    en: "Add an item from the pharmacy catalog before checking out.",
    sw: "Ongeza bidhaa kutoka orodha ya duka la dawa kabla ya kulipa.",
  },
  checkout_browse_pharmacy: { en: "Browse pharmacy", sw: "Vinjari duka la dawa" },
  checkout_back_to_pharmacy: { en: "Back to pharmacy", sw: "Rudi dukani" },
  checkout_title: { en: "Checkout", sw: "Malipo" },
  checkout_qty: { en: "Qty", sw: "Idadi" },
  checkout_fulfillment: { en: "Fulfillment", sw: "Njia ya kupokea" },
  checkout_pickup: { en: "Pickup", sw: "Kuchukua mwenyewe" },
  checkout_delivery: { en: "Delivery", sw: "Kuletewa" },
  checkout_delivery_fee: { en: "Delivery fee", sw: "Ada ya kuletewa" },
  checkout_pickup_fee: { en: "Pickup fee", sw: "Ada ya kuchukua" },
  checkout_total: { en: "Total", sw: "Jumla" },
  checkout_place_order: { en: "Place order", sw: "Weka agizo" },
  video_mute_mic: { en: "Mute microphone", sw: "Zima maikrofoni" },
  video_unmute_mic: { en: "Unmute microphone", sw: "Washa maikrofoni" },
  video_camera_off_action: { en: "Turn camera off", sw: "Zima kamera" },
  video_camera_on_action: { en: "Turn camera on", sw: "Washa kamera" },
  video_leave_call: { en: "Leave call", sw: "Ondoka kwenye simu" },
  video_camera_off_label: { en: "Camera off", sw: "Kamera imezimwa" },
  video_call_ended: { en: "Call ended", sw: "Simu imeisha" },
  video_close_window: { en: "You can close this window.", sw: "Unaweza kufunga dirisha hili." },
  consultation_upgrade_title: {
    en: "Set up your account",
    sw: "Andaa akaunti yako",
  },
  consultation_upgrade_body: {
    en: "Create a password so you can sign back in anytime to follow up on this visit and see your session history.",
    sw: "Weka nywila ili uweze kuingia tena wakati wowote kufuatilia ziara hii na kuona historia ya vipindi vyako.",
  },
  consultation_upgrade_password_label: { en: "Password", sw: "Nywila" },
  consultation_upgrade_password_confirm_label: {
    en: "Confirm password",
    sw: "Thibitisha nywila",
  },
  consultation_upgrade_cta: { en: "Create my account", sw: "Unda akaunti yangu" },
  consultation_upgrade_success: {
    en: "Account created. You can sign in anytime with your phone number and this password.",
    sw: "Akaunti imeundwa. Unaweza kuingia wakati wowote kwa nambari yako ya simu na nywila hii.",
  },
  consultation_upgrade_mismatch_error: {
    en: "Passwords don't match.",
    sw: "Nywila hazifanani.",
  },
  consultation_upgrade_length_error: {
    en: "Password must be at least 8 characters.",
    sw: "Nywila lazima iwe na herufi 8 au zaidi.",
  },
  consultation_upgrade_go_to_account: {
    en: "Go to my account",
    sw: "Nenda kwenye akaunti yangu",
  },
  video_waiting_for_other: {
    en: "Waiting for the other person to join…",
    sw: "Inasubiri mtu mwingine ajiunge…",
  },
  video_reconnecting: {
    en: "Reconnecting…",
    sw: "Inaunganisha tena…",
  },
  video_poor_connection: {
    en: "Weak connection",
    sw: "Mtandao dhaifu",
  },
  video_connection_lost_title: {
    en: "Connection lost",
    sw: "Muunganisho umekatika",
  },
  video_connection_lost_body: {
    en: "Your network dropped the call. Check your connection and reconnect.",
    sw: "Mtandao wako umekatisha simu. Angalia muunganisho wako kisha uunganishe tena.",
  },
  video_reconnect_action: {
    en: "Reconnect",
    sw: "Unganisha tena",
  },
  video_reconnecting_action: {
    en: "Reconnecting…",
    sw: "Inaunganisha…",
  },
  video_reconnect_failed: {
    en: "Couldn't reconnect. Check your network and try again.",
    sw: "Imeshindwa kuunganisha tena. Angalia mtandao wako kisha ujaribu tena.",
  },
  consultation_couldnt_start: {
    en: "Couldn't start the call.",
    sw: "Imeshindwa kuanzisha simu.",
  },
  consultation_couldnt_join: {
    en: "Couldn't join this consultation",
    sw: "Imeshindwa kujiunga na ushauri huu",
  },
  consultation_connecting: {
    en: "Connecting to your consultation...",
    sw: "Inaunganisha kwenye ushauri wako...",
  },
  error_appointment_id_required: { en: "appointmentId is required", sw: "appointmentId inahitajika" },
  error_appointment_not_found: { en: "Appointment not found", sw: "Miadi haikupatikana" },
  error_not_authorized_appointment: {
    en: "Not authorized for this appointment",
    sw: "Hauna ruhusa kwa miadi hii",
  },
  error_access_window_expired: {
    en: "Your 24-hour access window for this visit has ended. Please book a new consultation.",
    sw: "Muda wako wa saa 24 wa kufikia ziara hii umeisha. Tafadhali weka miadi mpya ya ushauri.",
  },
  error_payment_required: {
    en: "Payment is required before you can join this consultation.",
    sw: "Malipo yanahitajika kabla ya kujiunga na ushauri huu.",
  },
  payment_complete_link: { en: "Complete payment", sw: "Kamilisha malipo" },
  payment_page_title: { en: "Pay for your consultation", sw: "Lipia ushauri wako" },
  payment_page_body: {
    en: "Your doctor will be ready once payment is confirmed.",
    sw: "Daktari wako atakuwa tayari mara malipo yatakapothibitishwa.",
  },
  payment_summary_label: { en: "Consultation with", sw: "Ushauri na" },
  payment_provider_label: { en: "Mobile money provider", sw: "Mtoa huduma wa pesa za simu" },
  payment_provider_mpesa: { en: "M-Pesa", sw: "M-Pesa" },
  payment_provider_airtel: { en: "Airtel Money", sw: "Airtel Money" },
  payment_provider_halotel: { en: "Halotel", sw: "Halotel" },
  payment_provider_mixx: { en: "Mixx by Yas", sw: "Mixx by Yas" },
  payment_phone_label: { en: "Phone number", sw: "Namba ya simu" },
  payment_phone_placeholder: { en: "0712 345 678", sw: "0712 345 678" },
  payment_pay_button: { en: "Pay now", sw: "Lipa sasa" },
  payment_secure_note: {
    en: "Your payment is processed securely",
    sw: "Malipo yako yanafanywa kwa usalama",
  },
  payment_pay_pending: { en: "Starting payment…", sw: "Inaanzisha malipo…" },
  payment_waiting_title: {
    en: "Waiting for payment confirmation",
    sw: "Inasubiri uthibitisho wa malipo",
  },
  payment_waiting_body: {
    en: "Approve the payment prompt on your phone to continue.",
    sw: "Idhinisha ombi la malipo kwenye simu yako ili kuendelea.",
  },
  payment_taking_longer: {
    en: "This is taking longer than usual. Check your phone for the payment prompt, or try again.",
    sw: "Hii inachukua muda mrefu kuliko kawaida. Angalia simu yako kwa ombi la malipo, au jaribu tena.",
  },
  payment_failed_title: { en: "Payment didn't go through", sw: "Malipo hayajakamilika" },
  payment_failed_body: {
    en: "Your payment wasn't completed. You can try again.",
    sw: "Malipo yako hayajakamilika. Unaweza kujaribu tena.",
  },
  payment_retry_button: { en: "Try again", sw: "Jaribu tena" },
  payment_cancel_button: { en: "Cancel and try again", sw: "Ghairi na ujaribu tena" },
  payment_already_paid: {
    en: "This consultation is already paid for.",
    sw: "Ushauri huu tayari umeshalipiwa.",
  },
  legal_last_updated: { en: "Last updated August 2026", sw: "Ilisasishwa mwisho Agosti 2026" },
  terms_title: { en: "Terms of Service", sw: "Vigezo vya Huduma" },
  terms_s1_title: { en: "1. What Afya24 is", sw: "1. Afya24 ni nini" },
  terms_s1_body: {
    en: "Afya24 is a direct-pay telehealth marketplace. You describe a health concern to Afya24, get matched with licensed doctors, compare upfront pricing, and consult by chat, voice, or video. Every diagnosis, prescription, lab order, and referral is reviewed and issued by a licensed clinician — Afya24 summarizes and routes, it never makes a final medical decision on its own.",
    sw: "Afya24 ni soko la matibabu ya mtandaoni la kulipa moja kwa moja. Unaeleza tatizo la afya kwa Afya24, upangiwe madaktari wenye leseni, ulinganishe bei wazi, na uongee kwa ujumbe, sauti, au video. Kila uchunguzi, dawa, agizo la maabara, na rufaa hupitiwa na kutolewa na daktari mwenye leseni — Afya24 hufupisha na kuelekeza tu, haufanyi uamuzi wa mwisho wa kitabibu peke yake.",
  },
  terms_s2_title: { en: "2. Not for emergencies", sw: "2. Sio kwa dharura" },
  terms_s2_body: {
    en: "Afya24 is not equipped to handle medical emergencies. If you have chest pain, severe bleeding, difficulty breathing, or any other life-threatening symptom, go to the nearest emergency room or call emergency services immediately instead of starting a virtual visit.",
    sw: "Afya24 haiwezi kushughulikia dharura za kitabibu. Ikiwa una maumivu ya kifua, kutokwa damu nyingi, ugumu wa kupumua, au dalili nyingine hatari kwa maisha, nenda hospitali ya dharura iliyo karibu au piga simu huduma za dharura mara moja badala ya kuanzisha ziara ya mtandaoni.",
  },
  terms_s3_title: { en: "3. Your account", sw: "3. Akaunti yako" },
  terms_s3_body: {
    en: "You're responsible for keeping your login credentials confidential and for the accuracy of the information you provide, including your identity, date of birth, and contact details. You can also access your records without creating an account by using your hospital reference number together with an identity check.",
    sw: "Una jukumu la kuhifadhi siri za kuingia kwako na kuhakikisha usahihi wa taarifa unazotoa, ikiwa ni pamoja na utambulisho wako, tarehe ya kuzaliwa, na maelezo ya mawasiliano. Unaweza pia kufikia rekodi zako bila kuunda akaunti kwa kutumia nambari yako ya rejea ya hospitali pamoja na uthibitisho wa utambulisho.",
  },
  terms_s4_title: { en: "4. Payment and pricing", sw: "4. Malipo na bei" },
  terms_s4_body: {
    en: "Prices shown before booking are the prices you pay — there's no insurance billing or surprise fees layered on afterward. Consultation fees are charged at booking; pharmacy and lab charges are shown separately at checkout once a doctor has approved the relevant order.",
    sw: "Bei zinazoonyeshwa kabla ya kuweka miadi ndizo bei unazolipa — hakuna malipo ya bima au ada za kushtukiza zinazoongezwa baadaye. Ada za ushauri hulipwa wakati wa kuweka miadi; ada za duka la dawa na maabara huonyeshwa kando wakati wa malipo baada ya daktari kuidhinisha agizo husika.",
  },
  terms_s5_title: { en: "5. Doctor-approved next steps", sw: "5. Hatua zinazofuata zilizoidhinishwa na daktari" },
  terms_s5_body: {
    en: "Prescriptions can only be filled through Afya24's pharmacy checkout after a doctor has reviewed and signed them. Lab referrals and their associated location/contact details are only shared after a doctor creates the referral. We don't operate an open pharmacy or lab-booking service independent of a clinical visit.",
    sw: "Dawa zinaweza tu kupatikana kupitia malipo ya duka la dawa la Afya24 baada ya daktari kuzipitia na kuzisaini. Rufaa za maabara na maelezo ya eneo/mawasiliano yanayohusiana hushirikiwa tu baada ya daktari kuunda rufaa. Hatuendeshi duka la dawa au huduma ya kuweka miadi ya maabara wazi bila kuhusiana na ziara ya kitabibu.",
  },
  terms_s6_title: { en: "6. Acceptable use", sw: "6. Matumizi yanayokubalika" },
  terms_s6_body: {
    en: "Don't use Afya24 to impersonate another person, submit false medical information, or attempt to access another patient's records. Accounts used this way may be suspended.",
    sw: "Usitumie Afya24 kujifanya mtu mwingine, kutoa taarifa za uongo za kitabibu, au kujaribu kufikia rekodi za mgonjwa mwingine. Akaunti zinazotumika hivi zinaweza kusimamishwa.",
  },
  terms_s7_title: { en: "7. Changes", sw: "7. Mabadiliko" },
  terms_s7_body: {
    en: "We may update these terms as Afya24's services change. Material changes will be reflected here with an updated date.",
    sw: "Tunaweza kusasisha vigezo hivi huduma za Afya24 zinapobadilika. Mabadiliko muhimu yataonyeshwa hapa pamoja na tarehe iliyosasishwa.",
  },
  help_title: { en: "Help center", sw: "Kituo cha msaada" },
  help_subtitle: {
    en: "Common questions about how Afya24 works.",
    sw: "Maswali yanayoulizwa mara kwa mara kuhusu jinsi Afya24 inavyofanya kazi.",
  },
  help_contact_cta: {
    en: "Still need help? Email us",
    sw: "Bado unahitaji msaada? Tutumie barua pepe",
  },
  help_q1_title: { en: "How does Afya24 work?", sw: "Afya24 inafanyaje kazi?" },
  help_q1_body: {
    en: "Describe your symptoms to the Afya24 assistant. It asks a few follow-up questions, summarizes what you told it for your confirmation, then connects you with a licensed doctor by voice or video.",
    sw: "Eleza dalili zako kwa msaidizi wa Afya24. Anauliza maswali machache zaidi, anafupisha ulichomwambia ili uthibitishe, kisha anakuunganisha na daktari mwenye leseni kupitia sauti au video.",
  },
  help_q2_title: { en: "Are these real, licensed doctors?", sw: "Hawa ni madaktari halisi wenye leseni?" },
  help_q2_body: {
    en: "Yes. Doctors are credential-reviewed by Afya24 before they can be matched with patients.",
    sw: "Ndiyo. Madaktari hukaguliwa sifa zao na Afya24 kabla ya kuunganishwa na wagonjwa.",
  },
  help_q3_title: { en: "What if this is an emergency?", sw: "Vipi ikiwa hii ni dharura?" },
  help_q3_body: {
    en: "Afya24 is not for emergencies. If you have severe chest pain, difficulty breathing, heavy bleeding, or any other life-threatening symptom, go to the nearest hospital or call emergency services immediately.",
    sw: "Afya24 sio kwa dharura. Ikiwa una maumivu makali ya kifua, ugumu wa kupumua, kutokwa damu nyingi, au dalili nyingine yoyote hatari kwa maisha, nenda hospitali ya karibu au piga simu huduma za dharura mara moja.",
  },
  help_q4_title: { en: "Do I need to create an account first?", sw: "Ninahitaji kuunda akaunti kwanza?" },
  help_q4_body: {
    en: "No. The AI assistant sets up a lightweight patient file for you automatically during your first chat, using just your name, phone, and date of birth. You can turn it into a full password-protected account after your first consultation.",
    sw: "Hapana. Msaidizi wa AI huandaa faili rahisi ya mgonjwa kwa ajili yako moja kwa moja wakati wa mazungumzo yako ya kwanza, kwa kutumia jina lako, simu, na tarehe ya kuzaliwa tu. Unaweza kuibadilisha kuwa akaunti kamili yenye nywila baada ya ushauri wako wa kwanza.",
  },
  help_q5_title: { en: "How do I find my past visit?", sw: "Ninawezaje kupata ziara yangu ya awali?" },
  help_q5_body: {
    en: "Go to \"Find my visit\" and enter your reference number plus your PIN (or date of birth if you haven't set a PIN yet).",
    sw: "Nenda \"Tafuta ziara yangu\" na uweke nambari yako ya rejea pamoja na PIN yako (au tarehe ya kuzaliwa kama bado hujaweka PIN).",
  },
  help_q6_title: { en: "How much does a consultation cost?", sw: "Ushauri unagharimu kiasi gani?" },
  help_q6_body: {
    en: "The price is shown before you confirm a booking. Afya24 is direct-pay, with no hidden fees.",
    sw: "Bei inaonyeshwa kabla ya kuthibitisha miadi. Afya24 ni malipo ya moja kwa moja, bila ada zilizofichwa.",
  },
  help_q7_title: { en: "Is my information private?", sw: "Maelezo yangu ni ya faragha?" },
  help_q7_body: {
    en: "Yes. Your health information is only shared with the doctor treating you. See our Privacy Policy for details.",
    sw: "Ndiyo. Maelezo yako ya afya yanashirikiwa tu na daktari anayekutibu. Angalia Sera yetu ya Faragha kwa maelezo zaidi.",
  },
  privacy_title: { en: "Privacy Policy", sw: "Sera ya Faragha" },
  privacy_s1_title: { en: "1. What we collect", sw: "1. Tunachokusanya" },
  privacy_s1_body: {
    en: "Account details (name, date of birth, contact info), what you tell Afya24 about your health concern, consultation notes and outcomes from your doctor, prescriptions, lab orders, and pharmacy orders. Your medical file carries across visits so a doctor treating you later has your relevant history.",
    sw: "Maelezo ya akaunti (jina, tarehe ya kuzaliwa, mawasiliano), unachomwambia Afya24 kuhusu tatizo lako la afya, maandishi na matokeo ya ushauri kutoka kwa daktari wako, dawa, maagizo ya maabara, na maagizo ya duka la dawa. Faili lako la matibabu hubaki kutoka ziara moja hadi nyingine ili daktari anayekutibu baadaye awe na historia yako muhimu.",
  },
  privacy_s2_title: { en: "2. Who can see it", sw: "2. Nani anaweza kuiona" },
  privacy_s2_body: {
    en: "Only you and the clinicians and support staff directly involved in your care. Lab partners see only the specific order and the details needed to check you in. Pharmacy staff see only the prescription and fulfillment details needed to dispense it. Every access to a sensitive record is logged.",
    sw: "Wewe tu na madaktari na wafanyakazi wa msaada wanaohusika moja kwa moja na huduma yako. Washirika wa maabara huona tu agizo mahususi na maelezo yanayohitajika kukuandikisha. Wafanyakazi wa duka la dawa huona tu dawa na maelezo ya utoaji yanayohitajika kuitoa. Kila ufikiaji wa rekodi nyeti hurekodiwa.",
  },
  privacy_s3_title: { en: "3. How Afya24 is involved", sw: "3. Jinsi Afya24 inavyohusika" },
  privacy_s3_body: {
    en: "Afya24 summarizes what you describe and flags possible urgency for the doctor — it doesn't diagnose, prescribe, or make a final call on your care. Your original explanation is always kept alongside its summary so your doctor can compare the two. Automatically generated content is labeled as such throughout.",
    sw: "Afya24 hufupisha unachoeleza na kuashiria uwezekano wa uharaka kwa daktari — haifanyi uchunguzi, kuagiza dawa, au kufanya uamuzi wa mwisho kuhusu huduma yako. Maelezo yako ya awali hubaki daima pamoja na muhtasari wake ili daktari wako aweze kulinganisha vyote viwili. Maudhui yanayotengenezwa kiotomatiki huwekwa alama kama hivyo popote.",
  },
  privacy_s4_title: { en: "4. Related-case matching", sw: "4. Ulinganishaji wa kesi zinazohusiana" },
  privacy_s4_body: {
    en: "To help doctors recognize patterns, Afya24 can surface similar past cases. These comparisons only ever use anonymized snapshots — another patient's name, contact details, or files are never exposed through this feature.",
    sw: "Ili kusaidia madaktari kutambua mifumo, Afya24 inaweza kuonyesha kesi zinazofanana za awali. Ulinganishaji huu hutumia tu picha zisizo na utambulisho — jina la mgonjwa mwingine, maelezo ya mawasiliano, au faili hazionyeshwi kamwe kupitia huduma hii.",
  },
  privacy_s5_title: { en: "5. Reference-number access", sw: "5. Ufikiaji kwa nambari ya rejea" },
  privacy_s5_body: {
    en: "If you use your hospital reference number instead of an account, we ask for an additional identity check before showing any record, and we log lookup attempts (including failed ones) to guard against someone else trying reference numbers that aren't theirs.",
    sw: "Ikiwa unatumia nambari yako ya rejea ya hospitali badala ya akaunti, tunauliza uthibitisho wa ziada wa utambulisho kabla ya kuonyesha rekodi yoyote, na tunarekodi majaribio ya utafutaji (ikiwemo yaliyoshindwa) ili kulinda dhidi ya mtu mwingine anayejaribu nambari za rejea ambazo si zake.",
  },
  privacy_s6_title: { en: "6. What we don't do", sw: "6. Tusichofanya" },
  privacy_s6_body: {
    en: "We don't sell your health data. We don't let staff modify medical records without an audit trail. We don't carry a previous prescription or treatment plan into a new case without a doctor reviewing it first.",
    sw: "Hatuuzi data yako ya afya. Hatuwaruhusu wafanyakazi kubadilisha rekodi za matibabu bila ufuatiliaji. Hatubebe dawa au mpango wa matibabu wa awali kwenye kesi mpya bila daktari kuupitia kwanza.",
  },
  privacy_s7_title: { en: "7. Your choices", sw: "7. Chaguo zako" },
  privacy_s7_body: {
    en: "You can review your own record, and you can reach out to have your account and its associated data deleted, subject to the clinical and legal record-keeping obligations that apply to healthcare providers.",
    sw: "Unaweza kupitia rekodi yako mwenyewe, na unaweza kuwasiliana ili akaunti yako na data inayohusiana ifutwe, kulingana na wajibu wa kisheria na kitabibu wa kuhifadhi rekodi unaowahusu watoa huduma za afya.",
  },
  ai_chat_intro: {
    en: "Tell Afya24 what's going on, and we'll match you with the right doctor.",
    sw: "Mwambie Afya24 kinachoendelea, tukukutanishe na daktari sahihi.",
  },
  hero_body: {
    en: "Licensed doctors by chat, voice, or video. Direct-pay, no waiting rooms.",
    sw: "Madaktari wenye leseni kwa ujumbe, sauti, au video. Lipa moja kwa moja, bila foleni.",
  },
  qualification_ai_name: {
    en: "Afya24",
    sw: "Afya24",
  },
  qualification_ai_subtitle: {
    en: "Not a diagnosis — your doctor reviews everything.",
    sw: "Sio uchunguzi wa kitabibu — daktari wako atapitia kila kitu.",
  },
  qualification_input_placeholder: {
    en: "Type your reply...",
    sw: "Andika jibu lako...",
  },
  qualification_typing: {
    en: "Typing...",
    sw: "Anaandika...",
  },
  qualification_ai_summary_label: {
    en: "Afya24 summary",
    sw: "Muhtasari wa Afya24",
  },
  qualification_result_title: {
    en: "Here's what we understood",
    sw: "Hivi ndivyo tulivyoelewa",
  },
  qualification_doctor_summary_label: {
    en: "Draft summary for your doctor",
    sw: "Muhtasari wa awali kwa daktari wako",
  },
  qualification_patient_summary_label: {
    en: "Confirmed patient summary",
    sw: "Muhtasari uliothibitishwa na mgonjwa",
  },
  qualification_missing_info_label: {
    en: "Your doctor may ask about",
    sw: "Daktari wako anaweza kuuliza kuhusu",
  },
  qualification_view_doctors_cta: {
    en: "View matching doctors",
    sw: "Tazama madaktari wanaolingana",
  },
  qualification_start_over: {
    en: "Start over",
    sw: "Anza upya",
  },
  qualification_recommended_specialty: {
    en: "Recommended specialty",
    sw: "Utaalamu unaopendekezwa",
  },
  qualification_not_emergency_title: {
    en: "This is not for emergencies",
    sw: "Hii sio kwa dharura",
  },
  qualification_not_emergency_body: {
    en: "Based on what you described, please seek immediate in-person care or call emergency services now. Afya24 is not equipped to handle emergencies.",
    sw: "Kulingana na ulivyoelezea, tafadhali tafuta huduma ya haraka ya ana kwa ana au piga simu huduma za dharura sasa hivi. Afya24 haiwezi kushughulikia dharura.",
  },
  qualification_reference_number_label: {
    en: "Your reference number",
    sw: "Nambari yako ya rejea",
  },
  qualification_setting_up_account: {
    en: "Setting up your file…",
    sw: "Tunaandaa faili yako…",
  },
  qualification_session_error: {
    en: "We couldn't set up your file. Please try filling in your details below.",
    sw: "Hatukuweza kuandaa faili yako. Tafadhali jaza maelezo yako hapa chini.",
  },
  qualification_fallback_title: {
    en: "Let's get your file set up",
    sw: "Hebu tuandae faili yako",
  },
  qualification_fallback_body: {
    en: "We need a few details to connect you with a doctor.",
    sw: "Tunahitaji maelezo machache ili kukuunganisha na daktari.",
  },
  qualification_fallback_name_label: {
    en: "Full name",
    sw: "Jina kamili",
  },
  qualification_fallback_phone_label: {
    en: "Phone number",
    sw: "Nambari ya simu",
  },
  qualification_fallback_submit: {
    en: "Save my details",
    sw: "Hifadhi maelezo yangu",
  },
  qualification_fallback_error: {
    en: "Please fill in all fields.",
    sw: "Tafadhali jaza sehemu zote.",
  },
  qualification_pin_title: {
    en: "Set a PIN to protect your file",
    sw: "Weka PIN kulinda faili yako",
  },
  qualification_pin_body: {
    en: "Use this next time you look yourself up, instead of your date of birth.",
    sw: "Itumie wakati mwingine unapojitafuta, badala ya tarehe yako ya kuzaliwa.",
  },
  qualification_pin_label: { en: "4-digit PIN", sw: "PIN ya tarakimu 4" },
  qualification_pin_confirm_label: { en: "Confirm PIN", sw: "Thibitisha PIN" },
  qualification_pin_save_cta: { en: "Save PIN", sw: "Hifadhi PIN" },
  qualification_pin_skip_cta: { en: "Skip for now", sw: "Ruka kwa sasa" },
  qualification_pin_mismatch_error: {
    en: "PINs don't match.",
    sw: "PIN hazifanani.",
  },
  qualification_pin_invalid_error: {
    en: "PIN must be 4 to 6 digits.",
    sw: "PIN lazima iwe na tarakimu 4 hadi 6.",
  },
  qualification_pin_saved: {
    en: "PIN saved. Keep it somewhere safe.",
    sw: "PIN imehifadhiwa. Iweke mahali salama.",
  },
  qualification_pin_error: {
    en: "Couldn't save your PIN. You can still use your date of birth to look yourself up later.",
    sw: "Imeshindwa kuhifadhi PIN yako. Bado unaweza kutumia tarehe yako ya kuzaliwa kujitafuta baadaye.",
  },
  urgency_low_label: {
    en: "Low urgency",
    sw: "Kiwango cha chini cha uharaka",
  },
  urgency_moderate_label: {
    en: "Moderate urgency",
    sw: "Kiwango cha wastani cha uharaka",
  },
  urgency_high_label: {
    en: "High urgency",
    sw: "Kiwango cha juu cha uharaka",
  },
  urgency_emergency_label: {
    en: "Emergency",
    sw: "Dharura",
  },

  // --- Admin dashboard ---
  admin_dashboard_title: { en: "Admin dashboard", sw: "Dashibodi ya msimamizi" },
  admin_dashboard_subtitle: {
    en: "Providers, services, appointments, payments, and operations at a glance.",
    sw: "Watoa huduma, huduma, miadi, malipo, na uendeshaji kwa muhtasari.",
  },
  admin_kpi_appointments_today: { en: "Appointments today", sw: "Miadi ya leo" },
  admin_kpi_pending_payments: { en: "Pending payments", sw: "Malipo yanayosubiri" },
  admin_kpi_active_providers: { en: "Active providers", sw: "Watoa huduma amilifu" },
  admin_kpi_open_pharmacy: { en: "Open pharmacy orders", sw: "Maagizo ya dawa yaliyo wazi" },
  admin_kpi_open_labs: { en: "Open lab orders", sw: "Maagizo ya maabara yaliyo wazi" },
  admin_recent_activity: { en: "Recent activity", sw: "Shughuli za hivi karibuni" },
  admin_upcoming_appointments: { en: "Upcoming appointments", sw: "Miadi zijazo" },
  admin_search_providers_placeholder: {
    en: "Search providers by name or specialty",
    sw: "Tafuta watoa huduma kwa jina au utaalamu",
  },
  admin_col_provider: { en: "Provider", sw: "Mtoa huduma" },
  admin_col_specialty: { en: "Specialty", sw: "Utaalamu" },
  admin_col_status: { en: "Status", sw: "Hali" },
  admin_col_price: { en: "Price", sw: "Bei" },
  admin_col_actions: { en: "Actions", sw: "Vitendo" },
  admin_action_confirm: { en: "Confirm", sw: "Thibitisha" },
  admin_action_mark_failed: { en: "Mark failed", sw: "Weka kama imeshindwa" },
  admin_payments_empty: { en: "No payments yet.", sw: "Hakuna malipo bado." },
  admin_action_deactivate: { en: "Deactivate", sw: "Zima" },
  admin_action_activate: { en: "Activate", sw: "Washa" },
  admin_action_save: { en: "Save", sw: "Hifadhi" },
  admin_provider_status_active: { en: "Active", sw: "Hai" },
  admin_provider_status_pending: { en: "Pending", sw: "Inasubiri" },
  admin_provider_status_suspended: { en: "Suspended", sw: "Imesimamishwa" },
  admin_col_category: { en: "Category", sw: "Kategoria" },
  admin_col_service: { en: "Service", sw: "Huduma" },
  admin_col_duration: { en: "Duration", sw: "Muda" },
  admin_col_modes: { en: "Modes", sw: "Njia" },
  admin_service_status_active: { en: "Active", sw: "Hai" },
  admin_service_status_inactive: { en: "Inactive", sw: "Haifanyi kazi" },
  admin_col_patient_ref: { en: "Patient ref", sw: "Nambari ya rejea" },
  admin_col_scheduled: { en: "Scheduled", sw: "Wakati" },
  admin_col_mode: { en: "Mode", sw: "Njia" },
  admin_col_payment: { en: "Payment", sw: "Malipo" },
  admin_filter_all_statuses: { en: "All statuses", sw: "Hali zote" },
  admin_filter_all_providers: { en: "All providers", sw: "Watoa huduma wote" },
  admin_no_results: { en: "No results match your filters.", sw: "Hakuna matokeo yanayolingana na vichujio vyako." },
  admin_col_amount: { en: "Amount", sw: "Kiasi" },
  admin_payment_status_paid: { en: "Paid", sw: "Imelipwa" },
  admin_payment_status_pending: { en: "Pending", sw: "Inasubiri" },
  admin_payment_status_failed: { en: "Failed", sw: "Imeshindwa" },
  admin_payment_method_mpesa: { en: "M-Pesa", sw: "M-Pesa" },
  admin_payment_method_card: { en: "Card", sw: "Kadi" },
  admin_payment_method_cash: { en: "Cash", sw: "Fedha taslimu" },
  admin_col_items: { en: "Items", sw: "Bidhaa" },
  admin_col_fulfillment: { en: "Fulfillment", sw: "Njia ya kupokea" },
  admin_col_total: { en: "Total", sw: "Jumla" },
  admin_substitution_flag: { en: "Needs doctor approval", sw: "Inahitaji idhini ya daktari" },
  admin_pharmacy_status_pending: { en: "Pending", sw: "Inasubiri" },
  admin_pharmacy_status_preparing: { en: "Preparing", sw: "Inaandaliwa" },
  admin_pharmacy_status_ready: { en: "Ready for pickup", sw: "Tayari kuchukuliwa" },
  admin_pharmacy_status_delivery: { en: "Out for delivery", sw: "Inasafirishwa" },
  admin_pharmacy_status_delivered: { en: "Delivered", sw: "Imefikishwa" },
  admin_pharmacy_status_completed: { en: "Completed", sw: "Imekamilika" },
  admin_lab_orders_title: { en: "Lab orders", sw: "Maagizo ya maabara" },
  admin_lab_locations_title: { en: "Lab locations", sw: "Maeneo ya maabara" },
  admin_col_tests: { en: "Tests", sw: "Vipimo" },
  admin_col_location: { en: "Location", sw: "Eneo" },
  admin_col_whatsapp: { en: "WhatsApp", sw: "WhatsApp" },
  admin_lab_order_status_ordered: { en: "Ordered", sw: "Imeagizwa" },
  admin_lab_order_status_instructions_sent: { en: "Instructions sent", sw: "Maelekezo yametumwa" },
  admin_lab_order_status_sample_collected: { en: "Sample collected", sw: "Sampuli imekusanywa" },
  admin_lab_order_status_results_pending: { en: "Results pending", sw: "Matokeo yanasubiriwa" },
  admin_lab_order_status_results_ready: { en: "Results ready", sw: "Matokeo yako tayari" },
  admin_whatsapp_not_sent: { en: "Not sent", sw: "Haijatumwa" },
  admin_whatsapp_sent: { en: "Sent", sw: "Imetumwa" },
  admin_whatsapp_delivered: { en: "Delivered", sw: "Imefikishwa" },
  admin_whatsapp_failed: { en: "Failed", sw: "Imeshindwa" },
  admin_col_address: { en: "Address", sw: "Anwani" },
  admin_col_region: { en: "Region", sw: "Mkoa" },
  admin_col_hours: { en: "Hours", sw: "Masaa" },
  admin_lab_status_active: { en: "Active", sw: "Hai" },
  admin_lab_status_inactive: { en: "Inactive", sw: "Haifanyi kazi" },
  admin_col_actor: { en: "Actor", sw: "Mtenda" },
  admin_col_action: { en: "Action", sw: "Kitendo" },
  admin_col_entity: { en: "Details", sw: "Maelezo" },
  admin_col_time: { en: "Time", sw: "Wakati" },
  admin_audit_provider_added: { en: "Provider added", sw: "Mtoa huduma ameongezwa" },
  admin_audit_provider_status_changed: { en: "Provider status changed", sw: "Hali ya mtoa huduma imebadilishwa" },
  admin_audit_service_price_changed: { en: "Service price changed", sw: "Bei ya huduma imebadilishwa" },
  admin_audit_payment_confirmed: { en: "Payment confirmed", sw: "Malipo yamethibitishwa" },
  admin_audit_payment_marked_failed: { en: "Payment marked failed", sw: "Malipo yametajwa kushindwa" },
  admin_audit_payment_gateway_completed: { en: "Payment completed (gateway)", sw: "Malipo yamekamilika (mfumo wa malipo)" },
  admin_audit_payment_gateway_failed: { en: "Payment failed (gateway)", sw: "Malipo yameshindwa (mfumo wa malipo)" },
  admin_audit_lab_location_updated: { en: "Lab location updated", sw: "Eneo la maabara limesasishwa" },
  admin_audit_pharmacy_order_status_changed: {
    en: "Pharmacy order status changed",
    sw: "Hali ya agizo la duka la dawa imebadilishwa",
  },
  admin_audit_prescription_signed: { en: "Prescription signed", sw: "Dawa imesainiwa" },
  admin_audit_lab_order_approved: { en: "Lab order approved", sw: "Agizo la maabara limeidhinishwa" },

} as const;

export type TranslationKey = keyof typeof dict;

export function t(key: TranslationKey, locale: Locale): string {
  return dict[key][locale];
}

// Shared across pharmacy-preview.tsx, app/pharmacy/page.tsx, and anywhere
// else a PharmacyCategory needs a display label -- keeps the mapping in one
// place instead of duplicating it per component.
export const pharmacyCategoryKey: Record<string, TranslationKey> = {
  All: "pharmacy_cat_all",
  "Pain relief": "pharmacy_cat_pain_relief",
  Allergy: "pharmacy_cat_allergy",
  Antibiotics: "pharmacy_cat_antibiotics",
  "Vitamins & supplements": "pharmacy_cat_vitamins",
  Supplements: "pharmacy_cat_supplements",
  "Hospital tools": "pharmacy_cat_hospital_tools",
  "Medical devices": "pharmacy_cat_medical_devices",
  "Wound care": "pharmacy_cat_wound_care",
  "First aid": "pharmacy_cat_first_aid",
  "Cold & flu": "pharmacy_cat_cold_flu",
  "Chronic condition": "pharmacy_cat_chronic",
};

export const pharmacyBadgeKey: Record<string, TranslationKey> = {
  trending: "pharmacy_badge_trending",
  hot: "pharmacy_badge_hot",
  new: "pharmacy_badge_new",
  sale: "pharmacy_badge_sale",
};

export const pharmacyStockKey: Record<string, TranslationKey> = {
  in_stock: "pharmacy_stock_in",
  low_stock: "pharmacy_stock_low",
  out_of_stock: "pharmacy_stock_out",
};

export const pharmacyOrderStatusKey: Record<string, TranslationKey> = {
  pending: "pharmacy_order_pending",
  preparing: "pharmacy_order_preparing",
  ready_for_pickup: "pharmacy_order_ready",
  out_for_delivery: "pharmacy_order_delivery",
  delivered: "pharmacy_order_done",
};

export const appointmentStatusKey: Record<string, TranslationKey> = {
  scheduled: "appointment_status_scheduled",
  waiting: "appointment_status_waiting",
  in_progress: "appointment_status_in_progress",
  completed: "appointment_status_completed",
  cancelled: "appointment_status_cancelled",
};

export const staffRoleKey: Record<string, TranslationKey> = {
  admin: "role_admin",
  doctor: "role_doctor",
  pharmacy_staff: "role_pharmacy_staff",
  lab_staff: "role_lab_staff",
};

export const staffStatusKey: Record<string, TranslationKey> = {
  active: "status_active",
  suspended: "status_suspended",
  invited: "status_invited",
};

export const adminProviderStatusKey: Record<string, TranslationKey> = {
  active: "admin_provider_status_active",
  pending: "admin_provider_status_pending",
  suspended: "admin_provider_status_suspended",
};

export const adminServiceStatusKey: Record<string, TranslationKey> = {
  active: "admin_service_status_active",
  inactive: "admin_service_status_inactive",
};

export const adminPaymentStatusKey: Record<string, TranslationKey> = {
  pending: "admin_payment_status_pending",
  paid: "admin_payment_status_paid",
  failed: "admin_payment_status_failed",
};

export const adminPaymentMethodKey: Record<string, TranslationKey> = {
  mpesa: "admin_payment_method_mpesa",
  card: "admin_payment_method_card",
  cash: "admin_payment_method_cash",
};

export const adminPharmacyOrderStatusKey: Record<string, TranslationKey> = {
  pending: "admin_pharmacy_status_pending",
  preparing: "admin_pharmacy_status_preparing",
  ready_for_pickup: "admin_pharmacy_status_ready",
  out_for_delivery: "admin_pharmacy_status_delivery",
  delivered: "admin_pharmacy_status_delivered",
  completed: "admin_pharmacy_status_completed",
};

export const adminLabOrderStatusKey: Record<string, TranslationKey> = {
  ordered: "admin_lab_order_status_ordered",
  instructions_sent: "admin_lab_order_status_instructions_sent",
  sample_collected: "admin_lab_order_status_sample_collected",
  results_pending: "admin_lab_order_status_results_pending",
  results_ready: "admin_lab_order_status_results_ready",
};

export const adminWhatsappStatusKey: Record<string, TranslationKey> = {
  not_sent: "admin_whatsapp_not_sent",
  sent: "admin_whatsapp_sent",
  delivered: "admin_whatsapp_delivered",
  failed: "admin_whatsapp_failed",
};

export const adminLabLocationStatusKey: Record<string, TranslationKey> = {
  active: "admin_lab_status_active",
  inactive: "admin_lab_status_inactive",
};

export const adminAuditActionKey: Record<string, TranslationKey> = {
  provider_added: "admin_audit_provider_added",
  provider_status_changed: "admin_audit_provider_status_changed",
  service_price_changed: "admin_audit_service_price_changed",
  payment_confirmed: "admin_audit_payment_confirmed",
  payment_marked_failed: "admin_audit_payment_marked_failed",
  payment_gateway_completed: "admin_audit_payment_gateway_completed",
  payment_gateway_failed: "admin_audit_payment_gateway_failed",
  lab_location_updated: "admin_audit_lab_location_updated",
  pharmacy_order_status_changed: "admin_audit_pharmacy_order_status_changed",
  prescription_signed: "admin_audit_prescription_signed",
  lab_order_approved: "admin_audit_lab_order_approved",
};
