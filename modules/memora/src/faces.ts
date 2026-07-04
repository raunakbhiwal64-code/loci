/**
 * Names and faces (belt 4) — the party guests. Each guest is an
 * emoji-composed face plus a feature hint that links the NAME to something
 * you can SEE. That link is the whole technique: Mr Sharma has SHARP glasses.
 */

export interface Guest {
  id: string;
  name: string;
  /** Emoji composition: base face + their memorable feature. */
  face: string;
  /** The feature-link hint, spoken by the Guide during the learn phase. */
  hint: string;
}

export const GUESTS: Guest[] = [
  { id: "sharma", name: "Mr Sharma", face: "🧔🤓", hint: "Mr Sharma wears SHARP glasses 🤓 — sharp… Sharma!" },
  { id: "rao", name: "Mrs Rao", face: "👩‍🦱🚣", hint: "Mrs Rao ROWS her little boat everywhere 🚣 — row… Rao!" },
  { id: "bell", name: "Miss Bell", face: "👩🔔", hint: "Miss Bell rings a tiny BELL when she laughs 🔔." },
  { id: "singh", name: "Mr Singh", face: "👳🎤", hint: "Mr Singh loves to SING into his microphone 🎤 — sing… Singh!" },
  { id: "joshi", name: "Mrs Joshi", face: "👵😂", hint: "Mrs Joshi tells the most JOKES 😂 — joke-y… Joshi!" },
  { id: "fernandes", name: "Mr Fernandes", face: "🧑‍🦰🌿", hint: "Mr Fernandes grows giant FERNS 🌿 — fern… Fernandes!" },
  { id: "rose", name: "Miss Rose", face: "👧🌹", hint: "Miss Rose always wears a ROSE 🌹 — easy one!" },
  { id: "khan", name: "Mr Khan", face: "🧔‍♂️🥫", hint: "Mr Khan carries a CAN of mango juice 🥫 — can… Khan!" },
  { id: "iyer", name: "Mrs Iyer", face: "👩‍🦳👁️", hint: "Mrs Iyer has EYE-catching earrings 👁️ — eye… Iyer!" },
  { id: "wolf", name: "Mr Wolf", face: "🧓🐺", hint: "Mr Wolf has a WOLF-grey beard 🐺." },
  { id: "patel", name: "Miss Patel", face: "👧🌸", hint: "Miss Patel collects flower PETALS 🌸 — petal… Patel!" },
  { id: "gupta", name: "Mr Gupta", face: "👨💰", hint: "Mr Gupta GUARDS a treasure chest 💰 — guard… Gupta!" },
  { id: "cloud", name: "Mrs Cloud", face: "👩‍🦳☁️", hint: "Mrs Cloud has fluffy CLOUD-white hair ☁️." },
  { id: "reddy", name: "Mr Reddy", face: "👨🏁", hint: "Mr Reddy is always READY to race 🏁 — ready… Reddy!" },
  { id: "dsouza", name: "Miss D'Souza", face: "👩📯", hint: "Miss D'Souza plays a huge SOUSAphone 📯 — sousa… D'Souza!" },
  { id: "bose", name: "Mr Bose", face: "🧑🔊", hint: "Mr Bose plays music at full BOOM 🔊 — boom… Bose!" },
  { id: "green", name: "Mrs Green", face: "👩🥦", hint: "Mrs Green always eats her GREENS 🥦." },
  { id: "nair", name: "Mr Nair", face: "🧔‍♂️💇", hint: "Mr Nair has truly amazing HAIR 💇 — hair… Nair!" },
  { id: "chandra", name: "Miss Chandra", face: "👧🌙", hint: "Miss Chandra glows like the MOON 🌙 — Chandra means moon!" },
  { id: "baker", name: "Mr Baker", face: "👨‍🍳🍞", hint: "Mr Baker BAKES warm bread every morning 🍞." },
];
