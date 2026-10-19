// Hedhi (the period tracker app) privacy policy and terms, published here for Google Play.
// COPY of Hedhi/src/i18n/legal.ts in the Hedhi app repository: change both together so the app and the web never disagree.
type Lang = 'sw' | 'en';

export const LEGAL_UPDATED = '2026-10-19';
// The same text is published on the web for Google Play: https://afya24.com/hedhi/privacy (and /hedhi/terms).
// Keep the copy in the afya24 website (src/lib/hedhi-legal.ts) identical when this changes.
export const DELETE_URL = 'https://afya24.com/hedhi/delete-account';
// Replace with a mailbox that really exists before publishing.
export const CONTACT_EMAIL = 'justinmsanga2@gmail.com';

export type LegalSection = { title: string; body: string[] };
export type LegalDoc = { title: string; intro: string; updated: string; sections: LegalSection[] };

const privacySw: LegalDoc = {
  title: 'Sera ya Faragha',
  intro:
    'Hedhi ni programu ya kufuatilia hedhi. Taarifa zako za afya ni za siri sana, na tunazichukulia hivyo. Ukurasa huu unaeleza tunachokusanya, tunavyokitumia, na haki zako.',
  updated: 'Imesasishwa: 19 Oktoba 2026',
  sections: [
    {
      title: 'Taarifa zinazobaki kwenye simu yako',
      body: [
        'Hedhi hufanya kazi bila akaunti. Tarehe za hedhi, rekodi za kila siku (mtiririko, maumivu, hali ya mwili, dalili, madokezo), mipangilio ya mzunguko, jina, lengo lako na mwaka wa kuzaliwa (si lazima) huhifadhiwa kwenye simu yako.',
        'PIN au mchoro wako wa kufunga programu huhifadhiwa kwenye hifadhi salama ya simu, na hautumwi popote.',
        'Vikumbusho unavyowasha (hedhi inakaribia, siku za rutuba, shajara, dawa) hupangwa kwenye simu yako yenyewe.',
      ],
    },
    {
      title: 'Ukifungua akaunti',
      body: [
        'Tunahifadhi barua pepe yako na nenosiri lililosimbwa (au utambulisho wa Google ukiingia kwa Google). Tunatumia hizi kukuingiza na kukutumia msimbo wa kuthibitisha.',
        'Akaunti ni ya hiari. Ukiingia kwenye akaunti, tunahifadhi tarehe za hedhi, shajara yako (rekodi za kila siku), mipangilio, taarifa za ujauzito na miadi yako yenyewe, ili zisipotee na uzipate ukibadilisha simu. Mazungumzo ya msaidizi, PIN na idhini za AI hazihifadhiwi kwenye nakala.',
      ],
    },
    {
      title: 'Msaidizi wa AI',
      body: [
        'Ukiuliza swali kwa msaidizi, ujumbe wako hutumwa kwa seva yetu kisha kwa Anthropic (watoa huduma wa Claude) ili kutoa jibu. Tunaweza kuongeza namba chache za mzunguko wako (siku ya mzunguko, urefu wa mzunguko) kama umeruhusu.',
        'Tafadhali usiandike jina lako kamili, namba ya simu au anwani kwenye ujumbe. Mazungumzo hayahifadhiwi kwenye seva yetu. Tunahifadhi tu idadi ya ujumbe unaotumia kwa siku ili kudhibiti matumizi.',
        'Majibu ya AI ni elimu tu. Si utambuzi wala tiba.',
      ],
    },
    {
      title: 'Madaktari na miadi',
      body: [
        'Ukipanga miadi, tunahifadhi daktari uliyemchagua, tarehe, saa, aina ya miadi (kliniki, simu ya video au sauti) na maelezo mafupi ukiyaandika. Daktari husika anaona taarifa hizi ili kukuhudumia.',
        'Ukilipia ushauri, malipo hupitia Snippe (pesa kwa simu). Tunahifadhi kiasi, hali ya malipo na tarakimu 4 za mwisho tu za namba ya simu uliyolipia.',
        'Kwa simu za papo hapo, unasubiri kwenye foleni ya daktari na unaona nafasi yako tu; daktari haoni jina lako kwenye foleni. Simu za video na sauti hupita kwenye huduma ya LiveKit. Hatuzirekodi.',
      ],
    },
    {
      title: 'Mwenza (Partner sync)',
      body: [
        'Ukiamua kushiriki na mwenza wako, unachagua kinachoonekana: hedhi inayofuata, siku za rutuba au hali ya mwili inayotarajiwa. Mwenza haoni madokezo, dalili wala rekodi zako. Unaweza kuacha kushiriki wakati wowote na kiungo kitafutwa.',
        'Mwenza anaweza kuingia kwa kuchanganua QR yako tu, bila barua pepe. Akaunti hiyo inaweza kuona tu ulichoruhusu, na si kitu kingine.',
      ],
    },
    {
      title: 'Arifa',
      body: [
        'Ukiruhusu arifa, tunahifadhi anwani ya arifa ya simu yako (push token) na lugha yako, ili tukujulishe mambo ya akaunti yako, kama zamu yako kwa daktari au jibu la miadi. Arifa hizi pia huhifadhiwa kwenye kisanduku cha arifa ndani ya programu. Unachagua aina zipi zikufikie, na anwani hufutwa ukitoka kwenye akaunti.',
        'Arifa zote zina maneno ya kawaida, ili mtu akiona skrini ya simu yako asijue zinahusu nini.',
      ],
    },
    {
      title: 'Watoa huduma tunaowatumia',
      body: [
        'Supabase (kuhifadhi akaunti na nakala), Anthropic (msaidizi wa AI), Resend (kutuma barua pepe za msimbo), Google (kuingia kwa Google, na Firebase kufikisha arifa), LiveKit (simu za video na sauti), Snippe (malipo kwa simu), na Expo (kujenga programu na kutuma arifa). Wanachakata taarifa kwa niaba yetu tu na kwa madhumuni haya.',
      ],
    },
    {
      title: 'Hatufanyi nini',
      body: [
        'Hatuuzi taarifa zako. Hatuonyeshi matangazo. Hatutumii taarifa zako za afya kwa uuzaji wala kuzishiriki na watangazaji.',
      ],
    },
    {
      title: 'Kuhifadhi na kufuta',
      body: [
        'Unaweza kufuta akaunti yako kwenye Mipangilio > Akaunti, au kwenye tovuti: ' + DELETE_URL + '. Hii hufuta akaunti, nakala, miadi, arifa na ushirikiano wa mwenza kutoka kwenye seva zetu. Unaweza pia kufuta data zote kwenye simu kutoka sehemu hiyo hiyo.',
        'Barua pepe zilizokwisha tumwa zinaweza kubaki kwenye kumbukumbu za mtoa huduma wa barua pepe kwa muda mfupi.',
      ],
    },
    {
      title: 'Usalama',
      body: [
        'Taarifa husafirishwa kwa njia iliyosimbwa na zinalindwa kwa sheria za ufikiaji, ili kila mtu aone taarifa zake tu. Hakuna mfumo salama kabisa, lakini tunafanya juhudi kuulinda.',
      ],
    },
    {
      title: 'Haki zako',
      body: [
        'Una haki ya kuona, kusahihisha, kufuta na kupinga matumizi ya taarifa zako, na kuondoa ruhusa uliyotoa. Una pia haki ya kulalamika kwa mamlaka ya ulinzi wa taarifa binafsi ya nchi yako (Tanzania: Tume ya Ulinzi wa Taarifa Binafsi; Kenya: Ofisi ya Kamishna wa Ulinzi wa Data).',
      ],
    },
    {
      title: 'Umri',
      body: ['Hedhi ni kwa watu wa miaka 13 na zaidi. Aliye chini ya miaka 18 atumie kwa ushauri wa mzazi au mlezi.'],
    },
    {
      title: 'Mabadiliko na mawasiliano',
      body: [
        'Tukibadilisha sera hii tutakujulisha ndani ya programu. Maswali: ' + CONTACT_EMAIL + '.',
      ],
    },
  ],
};

const privacyEn: LegalDoc = {
  title: 'Privacy Policy',
  intro:
    'Hedhi is a period tracker. Your health information is very private, and we treat it that way. This page explains what we collect, how we use it, and your rights.',
  updated: 'Updated: 19 October 2026',
  sections: [
    {
      title: 'Information that stays on your phone',
      body: [
        'Hedhi works without an account. Your period dates, daily logs (flow, cramps, mood, symptoms, notes), cycle settings, name, goal and year of birth (optional) are stored on your phone.',
        'Your app-lock PIN or pattern is kept in the phone secure storage and is never sent anywhere.',
        'Reminders you turn on (period coming, fertile days, diary, pill) are scheduled on your phone itself.',
      ],
    },
    {
      title: 'If you create an account',
      body: [
        'We store your email and an encrypted password (or your Google identity if you sign in with Google). We use these to sign you in and to email you a verification code.',
        'An account is optional. While you are logged in, we automatically store your period dates, your diary (daily logs), settings, pregnancy details and appointments, so they are not lost and you get them back on a new phone. Assistant chats, your PIN and AI consent are not included in the backup.',
      ],
    },
    {
      title: 'The AI assistant',
      body: [
        'When you ask the assistant a question, your message is sent to our server and then to Anthropic (the makers of Claude) to produce an answer. If you allow it, we may add a few numbers about your cycle (cycle day, cycle length).',
        'Please do not type your full name, phone number or address in a message. Conversations are not stored on our server. We only keep a count of how many messages you use per day, to control usage.',
        'AI answers are education only. They are not a diagnosis or treatment.',
      ],
    },
    {
      title: 'Doctors and appointments',
      body: [
        'When you book, we store the doctor you chose, the date, time, type of visit (clinic, video or audio call) and any short note you write. The doctor can see this to care for you.',
        'If you pay for a consultation, payment goes through Snippe (mobile money). We store the amount, the payment status and only the last 4 digits of the phone number you paid with.',
        'For instant calls you wait in the doctor\'s queue and see only your own place; the doctor does not see your name in the queue. Video and audio calls run through the LiveKit service. We do not record them.',
      ],
    },
    {
      title: 'Partner sync',
      body: [
        'If you choose to share with a partner, you decide what they see: next period, fertile days or expected mood. They never see your notes, symptoms or logs. You can stop sharing at any time and the link is deleted.',
        'A partner can sign in just by scanning your QR code, with no email. That account can only see what you allowed, and nothing else.',
      ],
    },
    {
      title: 'Notifications',
      body: [
        'If you allow notifications, we store your phone\'s notification address (push token) and your language, so we can tell you about your account, such as your turn with the doctor or an answer to your booking. These are also kept in the notification inbox in the app. You choose which kinds reach you, and the address is removed when you log out.',
        'Every notification uses plain words, so someone who sees your screen cannot tell what it is about.',
      ],
    },
    {
      title: 'Services we use',
      body: [
        'Supabase (accounts and backups), Anthropic (AI assistant), Resend (verification emails), Google (Google sign-in, and Firebase to deliver notifications), LiveKit (video and audio calls), Snippe (mobile money payments) and Expo (building the app and sending notifications). They process data on our behalf only, and only for these purposes.',
      ],
    },
    {
      title: 'What we do not do',
      body: ['We do not sell your information. We show no ads. We do not use your health information for marketing or share it with advertisers.'],
    },
    {
      title: 'Keeping and deleting',
      body: [
        'You can delete your account in Settings > Account, or on the web: ' + DELETE_URL + '. This removes your account, backup, appointments, notifications and partner link from our servers. You can also erase all data on the phone from the same place.',
        'Emails already sent may remain in the email provider logs for a short time.',
      ],
    },
    {
      title: 'Security',
      body: [
        'Data travels encrypted and is protected by access rules, so each person can only see their own information. No system is perfectly secure, but we work to protect yours.',
      ],
    },
    {
      title: 'Your rights',
      body: [
        'You have the right to see, correct, delete and object to the use of your information, and to withdraw consent. You may also complain to your national data protection authority (Tanzania: Personal Data Protection Commission; Kenya: Office of the Data Protection Commissioner).',
      ],
    },
    {
      title: 'Age',
      body: ['Hedhi is for people aged 13 and over. Anyone under 18 should use it with a parent or guardian.'],
    },
    {
      title: 'Changes and contact',
      body: ['If we change this policy we will tell you in the app. Questions: ' + CONTACT_EMAIL + '.'],
    },
  ],
};

const termsSw: LegalDoc = {
  title: 'Masharti ya Matumizi',
  intro: 'Kwa kutumia Hedhi unakubali masharti haya. Tafadhali yasome.',
  updated: 'Imesasishwa: 19 Oktoba 2026',
  sections: [
    {
      title: 'Hedhi si huduma ya matibabu',
      body: [
        'Hedhi inatoa elimu na makadirio ya mzunguko. Haitoi utambuzi, tiba wala ushauri wa daktari. Makadirio ya siku za rutuba na uwezekano wa kupata mimba si njia ya kuzuia mimba na yanaweza kukosea.',
        'Ukiwa na dalili kali, maumivu yasiyoisha, damu nyingi, au dharura, nenda kituo cha afya mara moja.',
      ],
    },
    {
      title: 'Akaunti yako',
      body: [
        'Wewe ndiye unayewajibika kwa akaunti yako na usiri wa nenosiri, msimbo na PIN yako. Toa taarifa za kweli. Usimpe mtu mwingine akaunti yako.',
      ],
    },
    {
      title: 'Matumizi yanayokubalika',
      body: [
        'Usitumie Hedhi kwa udanganyifu, unyanyasaji, kuvunja sheria, kujaribu kuingia kwenye akaunti za wengine, au kuharibu huduma. Tunaweza kusimamisha akaunti inayovunja masharti haya.',
      ],
    },
    {
      title: 'Madaktari',
      body: [
        'Madaktari ni wataalamu huru. Hedhi ni jukwaa la kuwaunganisha na wewe, na haihusiki na maamuzi ya matibabu yao. Miadi inathibitishwa na daktari, na inaweza kukataliwa au kubadilishwa. Madaktari wa mfano walio kwenye programu ni wa kubuni.',
      ],
    },
    {
      title: 'Msaidizi wa AI',
      body: [
        'Majibu ya AI yanaweza kuwa na makosa. Usiyategemee badala ya daktari. Kuna kikomo cha ujumbe kwa siku.',
      ],
    },
    {
      title: 'Malipo',
      body: [
        'Baadhi ya huduma, kama mashauriano ya daktari, zinaweza kuwa za malipo siku zijazo. Bei na masharti ya malipo yataonyeshwa wazi kabla hujalipa.',
      ],
    },
    {
      title: 'Haki miliki',
      body: ['Programu, nembo, michoro na maudhui ya Hedhi ni mali yetu au tumepewa leseni. Taarifa zako binafsi ni zako.'],
    },
    {
      title: 'Kikomo cha wajibu',
      body: [
        'Tunatoa huduma "kama ilivyo". Kwa kiwango kinachoruhusiwa na sheria, hatuwajibiki kwa hasara inayotokana na kutegemea makadirio, majibu ya AI au upatikanaji wa huduma.',
      ],
    },
    {
      title: 'Kumaliza matumizi',
      body: ['Unaweza kuacha kutumia Hedhi na kufuta akaunti yako wakati wowote kwenye Mipangilio > Akaunti.'],
    },
    {
      title: 'Mabadiliko, sheria na mawasiliano',
      body: [
        'Tunaweza kubadilisha masharti haya na tutakujulisha ndani ya programu. Masharti haya yanafuata sheria za Jamhuri ya Muungano wa Tanzania. Maswali: ' + CONTACT_EMAIL + '.',
      ],
    },
  ],
};

const termsEn: LegalDoc = {
  title: 'Terms of Use',
  intro: 'By using Hedhi you agree to these terms. Please read them.',
  updated: 'Updated: 19 October 2026',
  sections: [
    {
      title: 'Hedhi is not medical care',
      body: [
        'Hedhi provides education and cycle estimates. It does not give a diagnosis, treatment or a doctor advice. Fertile-day and chance-of-pregnancy estimates are not a way to prevent pregnancy and can be wrong.',
        'If you have severe symptoms, pain that does not ease, heavy bleeding, or an emergency, go to a health facility right away.',
      ],
    },
    {
      title: 'Your account',
      body: [
        'You are responsible for your account and for keeping your password, codes and PIN private. Give true information. Do not share your account.',
      ],
    },
    {
      title: 'Acceptable use',
      body: [
        'Do not use Hedhi for fraud, harassment, anything illegal, trying to access other accounts, or harming the service. We may suspend an account that breaks these terms.',
      ],
    },
    {
      title: 'Doctors',
      body: [
        'Doctors are independent professionals. Hedhi is a platform that connects you with them and is not responsible for their medical decisions. Appointments are confirmed by the doctor and may be declined or changed. The sample doctors shown in the app are fictional.',
      ],
    },
    {
      title: 'AI assistant',
      body: ['AI answers can contain mistakes. Do not rely on them instead of a doctor. There is a daily message limit.'],
    },
    {
      title: 'Payments',
      body: [
        'Some services, such as doctor consultations, may become paid in the future. Prices and payment terms will be shown clearly before you pay.',
      ],
    },
    {
      title: 'Ownership',
      body: ['The Hedhi app, logo, artwork and content belong to us or are licensed to us. Your personal information is yours.'],
    },
    {
      title: 'Limits of liability',
      body: [
        'We provide the service "as is". To the extent allowed by law, we are not liable for loss caused by relying on estimates, AI answers or the availability of the service.',
      ],
    },
    {
      title: 'Ending use',
      body: ['You can stop using Hedhi and delete your account at any time in Settings > Account.'],
    },
    {
      title: 'Changes, law and contact',
      body: [
        'We may change these terms and will tell you in the app. These terms follow the laws of the United Republic of Tanzania. Questions: ' + CONTACT_EMAIL + '.',
      ],
    },
  ],
};

export const LEGAL: Record<'privacy' | 'terms', Record<Lang, LegalDoc>> = {
  privacy: { sw: privacySw, en: privacyEn },
  terms: { sw: termsSw, en: termsEn },
};
