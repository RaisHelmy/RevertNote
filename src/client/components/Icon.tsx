// Line icons from the original journal, plus a few for account actions.
const PATHS = {
  close: <path d="M6 6l12 12M18 6L6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  download: <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14" />,
  upload: <path d="M12 20V9m0 0L8 13m4-4l4 4M5 5h14" />,
  lock: (
    <>
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 018 0v3" />
    </>
  ),
  print: (
    <>
      <path d="M7 9V4h10v5M7 18H5a2 2 0 01-2-2v-4a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-2" />
      <rect x="7" y="14" width="10" height="6" rx="1" />
    </>
  ),
  prev: <path d="M14 6l-6 6 6 6" />,
  next: <path d="M10 6l6 6-6 6" />,
  pen: (
    <>
      <path d="M4 20l1-4L16 5l3 3L8 19l-4 1z" />
      <path d="M14 7l3 3" />
    </>
  ),
  squiggle: (
    <>
      <path d="M4 16c3-6 5 4 8-2s4-6 8-2" />
      <path d="M4 20h16" />
    </>
  ),
  eraser: (
    <>
      <path d="M4 15l7-7 6 6-7 7H6l-2-2z" />
      <path d="M9 20h11" />
    </>
  ),
  undo: (
    <>
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h9a6 6 0 010 12h-3" />
    </>
  ),
  shield: <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />,
  signout: <path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 16l-4-4 4-4M6 12h10" />,
};

export function Icon({ name }: { name: keyof typeof PATHS }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
