export interface Day {
  /** Day number, 1–40. */
  n: number;
  /** Week number, 1–6. */
  w: number;
  /** Title. */
  t: string;
  /** Reflection prompt. */
  p: string;
  /** Verse. */
  v: string;
  /** Verse reference. */
  r: string;
}

export const DAYS: Day[] = [
    {n:1, w:1, t:`What Happens When You Accept Islam?`, p:`Write about the moment you first said the Shahada. How did it feel inside your heart?`, v:`So whoever Allah wills to guide, He opens their heart to Islam.`, r:`Surah Al-An'am 6:125`},
    {n:2, w:1, t:`A Clean Slate: Allah's Mercy`, p:`How does it feel to know that your past is completely forgiven and you have been given a completely clean slate today?`, v:`Say, ‘O My servants who have transgressed against themselves, do not despair of the mercy of Allah. Indeed, Allah forgives all sins.’`, r:`Surah Az-Zumar 39:53`},
    {n:3, w:1, t:`Islam is a Journey, Not a Race`, p:`What is one area where you feel rushed, and how can you remind yourself to slow down and trust the process?`, v:`And keep yourself patient [by being] with those who call upon their Lord in the morning and the evening...`, r:`Surah Al-Kahf 18:28`},
    {n:4, w:1, t:`Regulating Excitement — Islam Feels Like a Cloud Nine`, p:`What emotions am I carrying today? What brings me the most excitement about this new path today? How can I turn this joy into a daily routine?`, v:`In the bounty of Allah and in His mercy — in that let them rejoice...`, r:`Surah Yunus 10:58`},
    {n:5, w:1, t:`Overcoming Fear & Uncertainty`, p:`What is your biggest fear right now, and how can you hand that worry over to Allah?`, v:`So do not fear them, but fear Me, if you are [indeed] believers.`, r:`Surah Ali 'Imran 3:175`},
    {n:6, w:1, t:`Understanding Loneliness & Finding Solace`, p:`Write down a moment today where you felt lonely. How can you use that quiet moment to turn to Allah in prayer?`, v:`Unquestionably, by the remembrance of Allah hearts are assured.`, r:`Surah Ar-Ra'd 13:28`},
    {n:7, w:1, t:`Navigating Initial Family Concerns`, p:`What is one way you can show extra love and helpfulness to your family members today?`, v:`And We have enjoined upon man goodness to his parents...`, r:`Surah Al-Ankabut 29:8`},
    {n:8, w:2, t:`Managing Information Overload`, p:`What is one piece of religious information that overwhelmed you today? Keep note of it but let it go for now and focus strictly on Allah's love.`, v:`Allah does not charge a soul except [with that within] its capacity.`, r:`Surah Al-Baqarah 2:286`},
    {n:9, w:2, t:`Understanding Tawhid`, p:`How does it simplify your life to know that you only have to seek the approval of One?`, v:`And your God is one God. There is no deity except Him, the Entirely Merciful, the Especially Merciful.`, r:`Surah Al-Baqarah 2:163`},
    {n:10, w:2, t:`The Power of Bismillah`, p:`Practice saying Bismillah before eating, drinking, or walking today. Does it change your experience of these actions?`, v:`Recite in the name of your Lord who created.`, r:`Surah Al-Alaq 96:1`},
    {n:11, w:2, t:`Talking to Allah: What is Salah?`, p:`How does your perception of prayer change when you view it as an intimate meeting with Allah rather than a chore?`, v:`And establish prayer for My remembrance.`, r:`Surah Taha 20:14`},
    {n:12, w:2, t:`Learning Al-Fatihah & Reading Qur'an`, p:`What feelings or thoughts stood out to you when you read or listened to the Qur'an today?`, v:`And We send down of the Qur'an that which is healing and mercy for the believers.`, r:`Surah Al-Isra 17:82`},
    {n:13, w:2, t:`Learning Wudu (Ablution)`, p:`Describe how you felt physically and spiritually refreshed after making your ablution today.`, v:`Indeed, Allah loves those who are constantly repentant and loves those who purify themselves.`, r:`Surah Al-Baqarah 2:222`},
    {n:14, w:2, t:`Practicing the Daily Prayer Steps`, p:`What part of the physical prayer movements (standing, bowing, prostrating) brings you the closest peace?`, v:`And bow down with those who bow down [in worship].`, r:`Surah Al-Baqarah 2:43`},
    {n:15, w:3, t:`The Gift of Dua (Personal Supplication)`, p:`Write a heartfelt, raw letter/dua to Allah right now in your own words, asking Him for exactly what you need.`, v:`And your Lord says, ‘Call upon Me; I will respond to you.’`, r:`Surah Ghafir 40:60`},
    {n:16, w:3, t:`Cultivating Dhikr (Remembrance)`, p:`Spend two minutes in complete silence repeating a word of remembrance. How does your heart feel now?`, v:`So remember Me; I will remember you.`, r:`Surah Al-Baqarah 2:152`},
    {n:17, w:3, t:`Growth Takes Time & Progress Over Perfection`, p:`What is one small religious habit you can commit to doing every single day without fail?`, v:`So fear Allah as much as you are able...`, r:`Surah At-Taghabun 64:16`},
    {n:18, w:3, t:`Perfecting Character & Kindness`, p:`How can you deliberately choose patience and kindness over anger in an interaction today?`, v:`And speak to people with good [words].`, r:`Surah Al-Baqarah 2:83`},
    {n:19, w:3, t:`Inner and Outer Cleanliness`, p:`What is one simple way you can clean or organize your physical environment today to honor your faith?`, v:`And your clothing purify.`, r:`Surah Al-Muddaththir 74:4`},
    {n:20, w:3, t:`Understanding Halal & Haram Basics`, p:`How do Islamic dietary and lifestyle guidelines serve to protect your overall health and well-being?`, v:`O mankind, eat from whatever is on earth [that is] lawful and good...`, r:`Surah Al-Baqarah 2:168`},
    {n:21, w:3, t:`Embracing Modesty (Haya)`, p:`How does dressing or behaving with modesty give you a sense of personal liberation and respect?`, v:`O children of Adam, We have bestowed upon you clothing to conceal your private parts and as adornment.`, r:`Surah Al-A'raf 7:26`},
    {n:22, w:4, t:`Replacing an Old Habit`, p:`What is one habit from your past that you are ready to substitute with a wholesome, rewarding Islamic habit?`, v:`Indeed, the righteous deeds do away with misdeeds.`, r:`Surah Hud 11:114`},
    {n:23, w:4, t:`Why Do I Miss My Old Life?`, p:`What specific part of your past lifestyle do you miss most, and how can you build a healthy, halal alternative?`, v:`And what is the worldly life except the enjoyment of delusion.`, r:`Surah Ali 'Imran 3:185`},
    {n:24, w:4, t:`Dealing with Social Pressure & Expectations`, p:`Whose opinions are you worrying too much about right now? How can you release that worry to Allah?`, v:`Is not Allah sufficient for His Servant?`, r:`Surah Az-Zumar 39:36`},
    {n:25, w:4, t:`You Are Not Alone — Stepping into a Mosque`, p:`Describe your thoughts or feelings when entering or thinking about entering a mosque. What would make you feel safer?`, v:`The mosques of Allah are only to be maintained by those who believe in Allah and the Last Day...`, r:`Surah At-Tawbah 9:18`},
    {n:26, w:4, t:`Seeking Islamic Classes & Right Knowledge`, p:`What is one specific Islamic topic you want to learn more about this week from a trusted source?`, v:`And say, ‘My Lord, increase me in knowledge.’`, r:`Surah Taha 20:114`},
    {n:27, w:4, t:`Be Part of the Community`, p:`What is one question that you would love to share or explore in a warm, welcoming circle of sisters/brothers at an upcoming event?`, v:`So ask the people of the message if you do not know.`, r:`Surah An-Nahl 16:43`},
    {n:28, w:4, t:`Building Muslim Friendships`, p:`Look around your life. Who is one person who inspires you to do good, and how can you connect with them?`, v:`And close friends, that Day, will be enemies to each other, except for the righteous.`, r:`Surah Az-Zukhruf 43:67`},
    {n:29, w:5, t:`Spiritual Fluctuation is Real`, p:`What triggers you to feel down or low in this journey? Have you figured how to manage them?`, v:`Allah does not burden a soul beyond that it can bear.`, r:`Surah Al-Baqarah 2:286`},
    {n:30, w:5, t:`Explaining Islam to Loved Ones`, p:`Draft a short, gentle script or phrase you can use to explain your new lifestyle choices to a friend or family member.`, v:`Invite to the way of your Lord with wisdom and good instruction...`, r:`Surah An-Nahl 16:125`},
    {n:31, w:5, t:`Maintaining Good Character with Non-Muslim Family`, p:`What is a practical gesture of kindness you can extend to your parents or siblings this weekend?`, v:`And We have enjoined upon man [care] for his parents. His mother carried him, [increasing her] in weakness upon weakness...`, r:`Surah Luqman 31:14`},
    {n:32, w:5, t:`Dealing with Slipping Up`, p:`If you had a spiritual setback recently, write down a reminder to yourself that Allah's forgiveness is instantly available.`, v:`Indeed, Allah loves those who are constantly repentant...`, r:`Surah Al-Baqarah 2:222`},
    {n:33, w:5, t:`What If My Employer Opposes My Faith?`, p:`What does true security look like to me, and how can I gently whisper to my anxious heart that Allah's plans for my provision are safer than any career path?`, v:`And whoever fears Allah — He will make for him a way out and will provide for him from where he does not expect.`, r:`Surah At-Talaq 65:2-3`},
    {n:34, w:5, t:`Staying Motivated Through Spiritual Lows`, p:`What simple, low-effort spiritual act can you rely on when you feel too exhausted for deeper study?`, v:`Allah intends for you ease and does not intend for you hardship.`, r:`Surah Al-Baqarah 2:185`},
    {n:35, w:5, t:`Can I Celebrate Family Events?`, p:`How can you actively show up for your family's joy while gently keeping your personal boundaries?`, v:`O you who have believed, seek help through patience and prayer.`, r:`Surah Al-Baqarah 2:153`},
    {n:36, w:6, t:`Lifelong Learning & Embracing the Journey`, p:`Reflect on how much more comfortable you feel today with basic terms compared to Day 1. Celebrate that growth.`, v:`And say, ‘My Lord, increase me in knowledge.’`, r:`Surah Taha 20:114`},
    {n:37, w:6, t:`Recognizing How Far Allah Has Brought You`, p:`Look back at your life six months ago. What changes are you most deeply grateful to Allah for creating in you?`, v:`And He found you lost and guided [you].`, r:`Surah Ad-Duha 93:7`},
    {n:38, w:6, t:`You Are an Outsider`, p:`How can I gently remind my soul that a lifetime of peace and beautiful eternity awaits me with Allah?`, v:`But the Hereafter is better and more enduring.`, r:`Surah Al-A'la 87:17`},
    {n:39, w:6, t:`Looking Forward with Clear Intentions`, p:`What are your top three personal spiritual goals for the next phase of your journey?`, v:`Say, ‘Indeed, my prayer, my rites of sacrifice, my living and my dying are for Allah, Lord of the worlds.’`, r:`Surah Al-An'am 6:162`},
    {n:40, w:6, t:`Firmly Grounded in Faith`, p:`Write a final, triumphant message to yourself celebrating this milestone. What is your heart asking Allah for most right now?`, v:`Allah keeps firm those who believe, with the firm word, in worldly life and in the Hereafter.`, r:`Surah Ibrahim 14:27`}
];

export const WEEK_WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];

export const WEEK_THEMES: Record<number, string> = {
  1: 'The First Steps of Rebirth',
  2: 'Grounding Your Knowledge',
  3: 'Nourishing the Intuitive Spirit',
  4: 'Walking Through Reality',
  5: 'Staying Steady Through Challenges',
  6: 'Steadfastness & the Eternal Home',
};

export const pad2 = (n: number) => String(n).padStart(2, '0');
export const clampDay = (n: number) => Math.max(1, Math.min(40, Number(n) || 1));
