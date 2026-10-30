import wuduSheet from '../assets/wudu-original.jpg';
import salahSheet from '../assets/salah-original.jpg';
import ghuslSheet from '../assets/ghusl-original.jpg';

export type GuideStep = {
  title: string;
  detail: string;
  /** Position of the illustration inside the 3 × 3 source sheet. */
  cell?: { row: 0 | 1 | 2; col: 0 | 1 | 2 };
  bismillah?: boolean;
};

export type Guide = {
  id: 'wudu' | 'salah' | 'ghusl';
  name: string;
  arabic: string;
  subtitle: string;
  intro: string;
  sheet: string;
  sheetAlt: string;
  /** Ordered steps for the washing guides; salah is laid out by rakʿah instead. */
  steps?: GuideStep[];
};

export const GUIDES: Guide[] = [
  {
    id: 'wudu',
    name: 'Wudu',
    arabic: 'وُضُوء',
    subtitle: 'Ablution',
    intro:
      'Wudu is the short washing that prepares you for prayer. Find clean water, roll up your sleeves, and take it slowly — nine small steps, a few minutes.',
    sheet: wuduSheet,
    sheetAlt: 'Wudu, ablution step by step: bismillah, hands, mouth, nose, face, arms, head, ears and feet.',
    steps: [
      {
        title: 'Bismillah',
        detail: 'Settle your intention in the heart, then begin in the name of Allah.',
        bismillah: true,
      },
      {
        title: 'Wash both hands',
        detail: 'Wash both hands up to the wrists three times, letting the water reach between the fingers.',
        cell: { row: 0, col: 1 },
      },
      {
        title: 'Rinse the mouth',
        detail: 'Take water into the mouth and rinse it around, three times.',
        cell: { row: 0, col: 2 },
      },
      {
        title: 'Rinse the nose',
        detail: 'Draw water gently into the nose and blow it out, three times.',
        cell: { row: 1, col: 0 },
      },
      {
        title: 'Wash the face',
        detail: 'Wash the whole face, from the hairline to the chin and ear to ear, three times.',
        cell: { row: 1, col: 1 },
      },
      {
        title: 'Wash the arms',
        detail: 'Wash from the fingertips to and including the elbows — the right arm first, then the left.',
        cell: { row: 1, col: 2 },
      },
      {
        title: 'Wipe the head',
        detail: 'With wet hands, wipe over the head from the forehead to the back, then return.',
        cell: { row: 2, col: 0 },
      },
      {
        title: 'Wipe the ears',
        detail: 'Wipe the inside of the ears with the index fingers and the backs with the thumbs.',
        cell: { row: 2, col: 1 },
      },
      {
        title: 'Wash the feet',
        detail: 'Wash the right foot to and including the ankle, then the left, three times.',
        cell: { row: 2, col: 2 },
      },
    ],
  },
  {
    id: 'salah',
    name: 'Salah',
    arabic: 'صَلَاة',
    subtitle: 'Prayer',
    intro:
      'Every prayer is the same cycle repeated two, three or four times. Choose a prayer and follow it rakʿah by rakʿah — the words are written out at each movement.',
    sheet: salahSheet,
    sheetAlt: 'Salah prayer movements: takbir, standing, bowing, prostration, sitting and salam.',
  },
  {
    id: 'ghusl',
    name: 'Ghusl',
    arabic: 'غُسْل',
    subtitle: 'Ritual bath',
    intro:
      'Ghusl is the full-body wash that removes major ritual impurity. It is needed after certain life events — take your time and make sure water reaches everywhere.',
    sheet: ghuslSheet,
    sheetAlt: 'Ghusl, the ritual bath, step by step from intention and bismillah to washing the whole body.',
    steps: [
      {
        title: 'Make the intention',
        detail: 'Intend in your heart to remove major ritual impurity for the sake of Allah.',
        cell: { row: 0, col: 0 },
      },
      {
        title: 'Say Bismillah',
        detail: 'Begin in the name of Allah before the water touches you.',
        cell: { row: 0, col: 1 },
      },
      {
        title: 'Wash the hands',
        detail: 'Wash both hands three times.',
        cell: { row: 0, col: 2 },
      },
      {
        title: 'Clean the private parts',
        detail: 'Remove any impurity and wash the private parts with the left hand.',
        cell: { row: 1, col: 0 },
      },
      {
        title: 'Wash the head',
        detail: 'Let water reach the scalp and the roots of the hair, three times.',
        cell: { row: 1, col: 1 },
      },
      {
        title: 'Wash the right side',
        detail: 'Pour water over the right side of the body, from shoulder to foot.',
        cell: { row: 1, col: 2 },
      },
      {
        title: 'Wash the left side',
        detail: 'Then pour water over the left side, from shoulder to foot.',
        cell: { row: 2, col: 0 },
      },
      {
        title: 'Complete',
        detail: 'Make sure water has reached the whole body, then step away clean and ready to pray.',
        cell: { row: 2, col: 1 },
      },
    ],
  },
];

/** What you say at a given movement. */
export type SalahSay = { ar?: string; tr: string; en: string };

export type SalahMove = {
  title: string;
  detail: string;
  say?: SalahSay;
  /** Also said, as the congregation's reply. */
  then?: SalahSay;
  cell: { row: 0 | 1 | 2; col: 0 | 1 | 2 };
  tone?: 'sit' | 'end';
};

export type SalahRakaat = { n: number; recite: string; moves: SalahMove[] };

export type SalahFlow = {
  id: 'two' | 'three' | 'four';
  count: number;
  rakaatLabel: string;
  prayers: string;
  note: string;
  rakaat: SalahRakaat[];
  /** YouTube video id of a full walkthrough (Prayer Man, "How to pray … for beginners"). */
  video: { id: string; title: string };
};

const TAKBIR: SalahSay = { ar: 'اللهُ أَكْبَرُ', tr: 'Allāhu Akbar', en: 'Allah is the greatest' };
const AZIM: SalahSay = {
  ar: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ',
  tr: 'Subḥāna Rabbiyal-ʿAẓīm',
  en: 'Glory to my Lord, the Most Great',
};
const HAMIDAH: SalahSay = {
  ar: 'سَمِعَ اللهُ لِمَنْ حَمِدَهُ',
  tr: 'Samiʿallāhu liman ḥamidah',
  en: 'Allah hears the one who praises Him',
};
const HAMIDAH_REPLY: SalahSay = {
  ar: 'رَبَّنَا وَلَكَ الْحَمْدُ',
  tr: 'Rabbanā wa lakal-ḥamd',
  en: 'Our Lord, to You belongs all praise',
};
const ALA: SalahSay = {
  ar: 'سُبْحَانَ رَبِّيَ الأَعْلَى',
  tr: 'Subḥāna Rabbiyal-Aʿlā',
  en: 'Glory to my Lord, the Most High',
};
const GHFIR: SalahSay = { ar: 'رَبِّ اغْفِرْ لِي', tr: 'Rabbighfir lī', en: 'My Lord, forgive me' };
const TAHIYYAT: SalahSay = {
  ar: 'التَّحِيَّاتُ لِلَّهِ…',
  tr: 'At-Tahiyyāt',
  en: 'All greetings of devotion are for Allah…',
};
const SALAM: SalahSay = {
  ar: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ',
  tr: 'Assalāmu ʿalaykum wa raḥmatullāh',
  en: 'Peace and Allah’s mercy be upon you',
};

/**
 * The deck lists every rakʿah in full, so the flows repeat the cycle instead of
 * asking a beginner to infer it. `surah` marks the first two rakʿah, where a
 * short chapter follows Al-Fātiḥah; `after` marks where a sitting falls.
 */
function rakah(n: number, o: { surah: boolean; after?: 'awwal' | 'end' }): SalahRakaat {
  const opening: SalahMove =
    n === 1
      ? {
          title: 'Open with the takbir',
          detail: 'Face the qiblah and raise your hands beside your ears.',
          say: TAKBIR,
          cell: { row: 0, col: 0 },
        }
      : {
          title: `Rise for rakʿah ${n}`,
          detail: 'Say the takbir and rise from prostration.',
          say: TAKBIR,
          cell: { row: 0, col: 0 },
        };

  const moves: SalahMove[] = [
    opening,
    {
      title: 'Stand and recite',
      detail: o.surah
        ? 'Recite Al-Fātiḥah, then a short sūrah. Fajr is prayed aloud; Zuhr and ʿAṣr quietly.'
        : 'Recite Al-Fātiḥah on its own — in the third and fourth rakʿah no extra sūrah is added.',
      say: { ar: 'فَاتِحَة الْكِتَاب', tr: 'Al-Fātiḥah', en: 'The opening chapter of the Qur’an' },
      cell: { row: 0, col: 1 },
    },
    {
      title: 'Bow (rukuʿ)',
      detail: 'Bow with a flat back, hands on the knees.',
      say: AZIM,
      cell: { row: 0, col: 2 },
    },
    {
      title: 'Rise from bowing',
      detail: 'Come back to full standing.',
      say: HAMIDAH,
      then: HAMIDAH_REPLY,
      cell: { row: 1, col: 0 },
    },
    {
      title: 'Prostrate (sujud)',
      detail: 'Forehead, nose, palms, knees and toes on the ground.',
      say: ALA,
      cell: { row: 1, col: 1 },
    },
    {
      title: 'Sit between the two sujuds',
      detail: 'Sit up calmly and ask.',
      say: GHFIR,
      cell: { row: 1, col: 2 },
    },
    {
      title: 'Prostrate again',
      detail: 'The second sujud of the rakʿah.',
      say: ALA,
      cell: { row: 2, col: 0 },
    },
  ];

  if (o.after === 'awwal') {
    moves.push({
      title: 'The first sitting',
      detail: 'Sit and recite At-Tahiyyāt, then stand for the next rakʿah.',
      say: TAHIYYAT,
      cell: { row: 2, col: 1 },
      tone: 'sit',
    });
  }

  if (o.after === 'end') {
    moves.push(
      {
        title: 'The final sitting',
        detail: 'Recite At-Tahiyyāt, the blessing on the Prophet ﷺ, and a duʿā of your own.',
        say: TAHIYYAT,
        cell: { row: 2, col: 1 },
        tone: 'end',
      },
      {
        title: 'Close with the salam',
        detail: 'Turn your face to the right, then to the left.',
        say: SALAM,
        cell: { row: 2, col: 2 },
        tone: 'end',
      },
    );
  }

  return {
    n,
    recite: o.surah ? 'Al-Fātiḥah + a sūrah' : 'Al-Fātiḥah only',
    moves,
  };
}

export const SALAH_FLOWS: SalahFlow[] = [
  {
    id: 'two',
    count: 2,
    rakaatLabel: '2 rakʿah',
    prayers: 'Fajr · Ṣubḥ',
    note: 'The shortest prayer. You sit only once, at the very end.',
    video: { id: 'YhgSe6DFK-0', title: 'How to pray Fajr (Subuh), 2 rakʿah' },
    rakaat: [rakah(1, { surah: true }), rakah(2, { surah: true, after: 'end' })],
  },
  {
    id: 'three',
    count: 3,
    rakaatLabel: '3 rakʿah',
    prayers: 'Maghrib',
    note: 'You sit after the second rakʿah for the first tashahhud, then stand for the third.',
    video: { id: '-7bw8v_MPmY', title: 'How to pray Maghrib, 3 rakʿah' },
    rakaat: [
      rakah(1, { surah: true }),
      rakah(2, { surah: true, after: 'awwal' }),
      rakah(3, { surah: false, after: 'end' }),
    ],
  },
  {
    id: 'four',
    count: 4,
    rakaatLabel: '4 rakʿah',
    prayers: 'Zuhr · ʿAṣr · ʿIshāʾ',
    note: 'Two sittings: the first tashahhud after rakʿah two, the full tashahhud at the end.',
    video: { id: 'zXjFF35J9PE', title: 'How to pray Zuhr (Zohor), 4 rakʿah' },
    rakaat: [
      rakah(1, { surah: true }),
      rakah(2, { surah: true, after: 'awwal' }),
      rakah(3, { surah: false }),
      rakah(4, { surah: false, after: 'end' }),
    ],
  },
];
