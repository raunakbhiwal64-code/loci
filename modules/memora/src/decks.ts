import type { AgeBand } from "@loci/module-sdk";

/**
 * The Deck shelf — "what should I memorise?" Age-banded, authored lists a
 * child can feed into any technique (story, palace, pegs). Facts only; every
 * deck has 6–12 items (content.test.ts enforces this).
 */

export interface Deck {
  id: string;
  title: string;
  emoji: string;
  /** One line on why knowing this by heart is handy. */
  why: string;
  items: string[];
}

const DECKS_8_9: Deck[] = [
  {
    id: "days",
    title: "Days of the week",
    emoji: "📅",
    why: "Know exactly what's coming tomorrow — and how far away Saturday is.",
    items: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  },
  {
    id: "months",
    title: "Months of the year",
    emoji: "🗓️",
    why: "Birthdays, holidays and festivals — you'll always know when they land.",
    items: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
  },
  {
    id: "rainbow",
    title: "Rainbow colours",
    emoji: "🌈",
    why: "Seven colours, always in the same order — spot them in every rainbow.",
    items: ["Red", "Orange", "Yellow", "Green", "Blue", "Indigo", "Violet"],
  },
  {
    id: "planets",
    title: "The planets",
    emoji: "🪐",
    why: "Eight worlds circling our Sun — know your neighbourhood in space.",
    items: ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"],
  },
  {
    id: "continents-oceans",
    title: "Continents & oceans",
    emoji: "🌍",
    why: "The whole map of Earth in twelve words.",
    items: [
      "Asia",
      "Africa",
      "North America",
      "South America",
      "Antarctica",
      "Europe",
      "Australia",
      "Pacific Ocean",
      "Atlantic Ocean",
      "Indian Ocean",
      "Southern Ocean",
      "Arctic Ocean",
    ],
  },
  {
    id: "school-bag",
    title: "School bag check",
    emoji: "🎒",
    why: "Run this list every morning and never leave anything behind.",
    items: ["Water bottle", "Lunch box", "Homework diary", "Pencil case", "Library book", "Sports shoes"],
  },
  {
    id: "water-cycle",
    title: "Water cycle steps",
    emoji: "💧",
    why: "How the same water travels from sea to sky to rain — forever.",
    items: [
      "Sunshine warms the water",
      "Evaporation",
      "Vapour rises",
      "Condensation (clouds form)",
      "Precipitation (rain falls)",
      "Runoff",
      "Collection in rivers and seas",
    ],
  },
  {
    id: "senses",
    title: "The five senses (plus one)",
    emoji: "👀",
    why: "How your body notices the world — plus a secret sixth sense.",
    items: [
      "Sight — eyes",
      "Hearing — ears",
      "Smell — nose",
      "Taste — tongue",
      "Touch — skin",
      "Balance — inner ear (the secret one!)",
    ],
  },
];

const DECKS_10_12: Deck[] = [
  {
    id: "planets-order",
    title: "Planets in order",
    emoji: "🪐",
    why: "From closest to the Sun to farthest — the solar system in one sweep.",
    items: ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"],
  },
  {
    id: "inventors",
    title: "Great inventors",
    emoji: "💡",
    why: "Eight people whose ideas changed everyday life.",
    items: [
      "Johannes Gutenberg — printing press",
      "James Watt — improved steam engine",
      "Alexander Graham Bell — telephone",
      "Thomas Edison — practical light bulb",
      "Karl Benz — motor car",
      "Wright brothers — aeroplane",
      "John Logie Baird — television",
      "Tim Berners-Lee — World Wide Web",
    ],
  },
  {
    id: "capitals",
    title: "Countries & capitals",
    emoji: "🏛️",
    why: "Ten starter capitals — quiz champions know these cold.",
    items: [
      "India — New Delhi",
      "France — Paris",
      "Japan — Tokyo",
      "United States — Washington, D.C.",
      "United Kingdom — London",
      "Australia — Canberra",
      "Brazil — Brasília",
      "Egypt — Cairo",
      "China — Beijing",
      "Russia — Moscow",
    ],
  },
  {
    id: "elements",
    title: "First 10 elements",
    emoji: "🧪",
    why: "The opening line of the periodic table — chemistry's alphabet.",
    items: [
      "Hydrogen",
      "Helium",
      "Lithium",
      "Beryllium",
      "Boron",
      "Carbon",
      "Nitrogen",
      "Oxygen",
      "Fluorine",
      "Neon",
    ],
  },
  {
    id: "fielding",
    title: "Cricket fielding positions",
    emoji: "🏏",
    why: "Know where everyone stands and you'll read the game like a captain.",
    items: ["Slip", "Gully", "Point", "Cover", "Mid-off", "Mid-on", "Midwicket", "Square leg", "Fine leg"],
  },
  {
    id: "freedom-fighters",
    title: "Freedom fighters of India",
    emoji: "🇮🇳",
    why: "Eight heroes of India's independence story.",
    items: [
      "Mahatma Gandhi",
      "Jawaharlal Nehru",
      "Subhas Chandra Bose",
      "Bhagat Singh",
      "Rani Lakshmibai",
      "Sardar Vallabhbhai Patel",
      "Sarojini Naidu",
      "Bal Gangadhar Tilak",
    ],
  },
  {
    id: "times-anchors",
    title: "Times-table anchor facts",
    emoji: "✖️",
    why: "Nail the tricky ones and every nearby fact is one hop away.",
    items: [
      "6 × 7 = 42",
      "6 × 8 = 48",
      "7 × 7 = 49",
      "7 × 8 = 56",
      "8 × 8 = 64",
      "9 × 7 = 63",
      "9 × 8 = 72",
      "12 × 12 = 144",
    ],
  },
  {
    id: "body-systems",
    title: "Human body systems",
    emoji: "🫀",
    why: "The eight teams that keep you running, breathing and thinking.",
    items: [
      "Skeletal system",
      "Muscular system",
      "Circulatory system",
      "Respiratory system",
      "Digestive system",
      "Nervous system",
      "Excretory system",
      "Immune system",
    ],
  },
];

export const DECKS: Record<AgeBand, Deck[]> = {
  "8-9": DECKS_8_9,
  "10-12": DECKS_10_12,
};

export function decksFor(band: AgeBand): Deck[] {
  return DECKS[band] ?? DECKS_8_9;
}
