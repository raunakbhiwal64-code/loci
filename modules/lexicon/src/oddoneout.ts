/**
 * Odd-one-out content (PRD 4.6) — pick the odd word AND say why.
 *
 * The stated reason is the pedagogy: the correct reason always names the
 * classification logic ("it is a vegetable — the others are fruits"), while
 * the wrong reasons are clearly not the rule that matters.
 */

export interface OddOneOutItem {
  /** Four words; one doesn't belong. */
  words: [string, string, string, string];
  /** Index of the odd word in `words`. */
  odd: number;
  /** Three candidate reasons; exactly one is right. */
  reasons: [string, string, string];
  /** Index of the correct reason in `reasons`. */
  correctReason: number;
}

function item(
  words: [string, string, string, string],
  odd: number,
  reasons: [string, string, string],
  correctReason: number
): OddOneOutItem {
  return { words, odd, reasons, correctReason };
}

export const ODD_ONE_OUT: OddOneOutItem[] = [
  item(
    ["apple", "banana", "carrot", "cherry"],
    2,
    [
      "It is a vegetable — the others are fruits",
      "It doesn't grow on plants",
      "You can't eat it raw",
    ],
    0
  ),
  item(
    ["dog", "cat", "sparrow", "rabbit"],
    2,
    [
      "It has no tail",
      "It is a bird — the others are furry mammals",
      "It can never be a pet",
    ],
    1
  ),
  item(
    ["red", "blue", "green", "circle"],
    3,
    [
      "It is a shape — the others are colors",
      "It is the darkest one",
      "It is impossible to draw",
    ],
    0
  ),
  item(
    ["run", "jump", "swim", "sleep"],
    3,
    [
      "It starts with the letter s",
      "It is the hardest to do",
      "The others are ways of moving your body — this one is resting",
    ],
    2
  ),
  item(
    ["car", "bus", "train", "bicycle"],
    3,
    [
      "It has no engine — you power it yourself",
      "It is the fastest",
      "It carries the most people",
    ],
    0
  ),
  item(
    ["Mars", "Jupiter", "Saturn", "Moon"],
    3,
    [
      "It is the biggest",
      "The others are planets — this one is not",
      "It is the hottest",
    ],
    1
  ),
  item(
    ["whisper", "mumble", "murmur", "shout"],
    3,
    [
      "It is the only loud one — the others are quiet ways of speaking",
      "It has the fewest letters",
      "It is not a way of speaking",
    ],
    0
  ),
  item(
    ["happy", "joyful", "cheerful", "furious"],
    3,
    [
      "It is the longest word",
      "It is an angry feeling — the others are happy feelings",
      "It is not a feeling at all",
    ],
    1
  ),
  item(
    ["triangle", "square", "pentagon", "circle"],
    3,
    [
      "It is the biggest shape",
      "It is not really a shape",
      "It has no straight sides or corners — the others do",
    ],
    2
  ),
  item(
    ["milk", "juice", "water", "bread"],
    3,
    [
      "It is a food you chew — the others are drinks",
      "It is the healthiest",
      "It comes from cows",
    ],
    0
  ),
  item(
    ["winter", "summer", "spring", "October"],
    3,
    [
      "It is the coldest",
      "It is a month — the others are seasons",
      "It has the most days",
    ],
    1
  ),
  item(
    ["pen", "pencil", "crayon", "eraser"],
    3,
    [
      "It is the most colorful",
      "It removes marks — the others make marks",
      "It is not used at school",
    ],
    1
  ),
  item(
    ["shark", "salmon", "dolphin", "tuna"],
    2,
    [
      "It cannot swim fast",
      "It is the smallest",
      "It is a mammal that breathes air — the others are fish",
    ],
    2
  ),
  item(
    ["two", "four", "seven", "eight"],
    2,
    [
      "It is the biggest number",
      "It is an odd number — the others are even",
      "It is not a number",
    ],
    1
  ),
  item(
    ["guitar", "violin", "harp", "drum"],
    3,
    [
      "It has no strings — you hit it instead",
      "It is the quietest",
      "It is not an instrument",
    ],
    0
  ),
  item(
    ["gigantic", "enormous", "colossal", "tiny"],
    3,
    [
      "It means very small — the others all mean very big",
      "It describes only animals",
      "It is the hardest to spell",
    ],
    0
  ),
  item(
    ["see", "hear", "taste", "think"],
    3,
    [
      "It uses your ears",
      "It is not one of the five senses",
      "It is something only adults do",
    ],
    1
  ),
  item(
    ["rose", "tulip", "daisy", "oak"],
    3,
    [
      "It is a tree — the others are flowers",
      "It smells the nicest",
      "It only grows in winter",
    ],
    0
  ),
  item(
    ["spoon", "fork", "knife", "plate"],
    3,
    [
      "It is the heaviest",
      "You cannot eat dinner without it",
      "Food sits on it — the others are used to pick food up",
    ],
    2
  ),
  item(
    ["gold", "silver", "copper", "wood"],
    3,
    [
      "It comes from trees — the others are metals",
      "It is the shiniest",
      "It is worth the most money",
    ],
    0
  ),
];
