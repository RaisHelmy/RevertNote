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
  steps: GuideStep[];
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
      'A rak‘ah is a single cycle of standing, bowing and prostrating. These are the movements, in order — the words can be learned a little at a time with your teacher.',
    sheet: salahSheet,
    sheetAlt: 'Salah prayer movements: takbir, standing, bowing, prostration, sitting and salam.',
    steps: [
      {
        title: 'Takbir',
        detail: 'Raise your hands to your ears and say “Allahu akbar” to begin the prayer.',
        cell: { row: 0, col: 0 },
      },
      {
        title: 'Qiyam',
        detail: 'Stand with your hands folded, reciting Al-Fatihah and a short surah.',
        cell: { row: 0, col: 1 },
      },
      {
        title: 'Ruku‘',
        detail: 'Bow with a level back and hands on the knees, saying “Subhana Rabbiyal-‘Adhim”.',
        cell: { row: 0, col: 2 },
      },
      {
        title: 'I‘tidal',
        detail: 'Rise from bowing and stand upright, saying “Sami‘allahu liman hamidah”.',
        cell: { row: 1, col: 0 },
      },
      {
        title: 'Sujud',
        detail: 'Prostrate with forehead, nose, palms, knees and toes resting on the ground.',
        cell: { row: 1, col: 1 },
      },
      {
        title: 'Jalsa',
        detail: 'Sit briefly between the two prostrations and ask Allah for forgiveness.',
        cell: { row: 1, col: 2 },
      },
      {
        title: 'Sujud again',
        detail: 'Prostrate a second time, then rise for the next rak‘ah.',
        cell: { row: 2, col: 0 },
      },
      {
        title: 'Tashahhud',
        detail: 'Sit and recite the tashahhud, raising the index finger at the testimony of faith.',
        cell: { row: 2, col: 1 },
      },
      {
        title: 'Salam',
        detail: 'Turn your head to the right, then to the left: “Assalamu ‘alaikum wa rahmatullah”.',
        cell: { row: 2, col: 2 },
      },
    ],
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
