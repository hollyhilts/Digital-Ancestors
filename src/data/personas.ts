export type PersonaCard = {
  id: string;
  code: string;
  name: string;
  subtitle: string;
  stanceText: string;
  image: string;
  imageAlt: string;
  defaultStance: string;
  favouriteMedium: string;
  famousQuote: string;
};

/** Hardcoded persona flip-card copy for the tracks section. */
export const PERSONAS: PersonaCard[] = [
  {
    id: "guardian",
    code: "DA-01",
    name: "Guardian",
    subtitle: "AI Hater",
    stanceText: "OPT-OUT",
    image: `${import.meta.env.BASE_URL}personas/guardian.PNG`,
    imageAlt: "Stylized ID portrait of the Guardian",
    defaultStance: "Opt-Out",
    favouriteMedium: "Anything Analogue",
    famousQuote: '"F*ck Data Centers"',
  },
  {
    id: "scribe",
    code: "DA-02",
    name: "Scribe",
    subtitle: "Line Drawer",
    stanceText: "CAUTIOUS-CURIOUS",
    image: `${import.meta.env.BASE_URL}personas/scribe.PNG`,
    imageAlt: "Stylized ID portrait of the Scribe",
    defaultStance: "Cautious-Curious",
    favouriteMedium: "All of it, just no AI art please",
    famousQuote: '"Automate the boring sh*t"',
  },
  {
    id: "weaver",
    code: "DA-04",
    name: "Weaver",
    subtitle: "Gardener",
    stanceText: "TENDING",
    image: `${import.meta.env.BASE_URL}personas/weaver.PNG`,
    imageAlt: "Stylized ID portrait of the Weaver",
    defaultStance: "Tending",
    favouriteMedium: "To be defined",
    famousQuote: "To be defined",
  },
  {
    id: "trailblazer",
    code: "DA-03",
    name: "Trailblazer",
    subtitle: "Experimenter",
    stanceText: "FULL SEND",
    image: `${import.meta.env.BASE_URL}personas/trailblazer.PNG`,
    imageAlt: "Stylized ID portrait of the Trailblazer",
    defaultStance: "Full Send",
    favouriteMedium: "Human-Machine Collaboration",
    famousQuote: '"I\'ll try anything once"',
  },
];
