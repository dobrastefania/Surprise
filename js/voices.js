/*
 * The opinions ("voices") about what a surprise means.
 *
 * Each voice becomes a dot on the "Where does it land for you?" line, a card under it,
 * and one of the notes that can come out of the fortune cookie.
 *
 *   id   – label shown in the dot; the text itself is in js/i18n.js under "voice.<id>"
 *   pos  – where the opinion sits on the line: 0 = "I brace", 100 = "I light up"
 *   page – optional: the chapter where the opinion is told in full
 *
 * To add one: add a line here, and a "voice.<id>" text in each language in js/i18n.js.
 */
window.VOICES = [
  { id: "01", pos: 18, page: "sides" },   // the one who waits
  { id: "02", pos: 89, page: "sides" },   // the one who gives
  { id: "03", pos: 96 },                  // bills paid by someone else
  { id: "04", pos: 74 },                  // make-up as a gift
  { id: "05", pos: 66 },                  // a day off
  { id: "06", pos: 82 },                  // a pay rise
  { id: "07", pos: 58 }                   // eight hours of sleep
];
