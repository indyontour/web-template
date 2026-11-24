import destinationContent from '../config/destinationContent';

/**
 * Get the suggested content for a destination option value (listing field `destination`).
 *
 * @param {string} destination option value, e.g. 'khaochalak'
 * @param {Object} [content] content map, defaults to src/config/destinationContent.js
 * @returns {Object|null} the destination's entry, or null if none is selected or it isn't configured
 */
export const getDestinationContent = (destination, content = destinationContent) => {
  if (!destination || typeof destination !== 'string') {
    return null;
  }
  return Object.prototype.hasOwnProperty.call(content, destination) ? content[destination] : null;
};

/**
 * Pick the text for the current locale from { en, th }. Thai locales use `th` when it's
 * available, everything else (and a missing `th`) falls back to `en`.
 *
 * @param {Object} texts e.g. { en: '...', th: null }
 * @param {string} [locale] e.g. 'en', 'th', 'th-TH'
 * @returns {string|null}
 */
export const getLocalizedText = (texts, locale) => {
  if (!texts) {
    return null;
  }
  const isThai = typeof locale === 'string' && locale.toLowerCase().startsWith('th');
  return (isThai && texts.th) || texts.en || null;
};

/**
 * Get the steps of an itinerary: its "- " lines without the dash. Other lines, like the
 * "Plan for the day:" heading, are left out: the listing page has its own translated heading.
 *
 * @param {string} itinerary
 * @returns {Array<string>}
 */
export const getItinerarySteps = itinerary => {
  if (!itinerary || typeof itinerary !== 'string') {
    return [];
  }
  return itinerary
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('-'))
    .map(line => line.replace(/^-\s*/, ''))
    .filter(step => step.length > 0);
};

/**
 * Everything the listing form and listing page need for one destination, in the current locale.
 *
 * @param {string} destination option value
 * @param {string} [locale]
 * @param {Object} [content] content map, defaults to src/config/destinationContent.js
 * @returns {{ meetingPoints: Array<string>, steps: Array<string>, durationHint: string|null }|null}
 *   null when no destination is selected or it isn't configured
 */
export const getDestinationSuggestions = (destination, locale, content = destinationContent) => {
  const entry = getDestinationContent(destination, content);
  if (!entry) {
    return null;
  }
  return {
    meetingPoints: Array.isArray(entry.meetingPoints) ? entry.meetingPoints : [],
    steps: getItinerarySteps(getLocalizedText(entry.itinerary, locale)),
    durationHint: getLocalizedText(entry.durationHint, locale),
  };
};

/**
 * All meeting points from every destination, each once, for the Departure point suggestions.
 * The given destination's own points come first, in their config order; the rest follow in the
 * order they first appear in the config. The per-destination lists themselves don't change.
 *
 * @param {string} [destination] option value of the selected destination, if any
 * @param {Object} [content] content map, defaults to src/config/destinationContent.js
 * @returns {Array<string>}
 */
export const getMeetingPointsFor = (destination, content = destinationContent) => {
  const own = getDestinationContent(destination, content)?.meetingPoints || [];
  const all = Object.values(content).flatMap(entry =>
    Array.isArray(entry?.meetingPoints) ? entry.meetingPoints : []
  );
  return [...new Set([...own, ...all])];
};

/**
 * beaway: fees paid on the day at a destination are kept in Marketplace texts (Console > Build >
 * Content > Marketplace texts), so they can change without a code deploy. Keys per destination:
 *   DestinationFees.<destination>.entranceThai     entrance fee per person, Thai visitors
 *   DestinationFees.<destination>.entranceForeign  entrance fee per person, foreign visitors
 *   DestinationFees.<destination>.guideThai        required local guide fee per person, Thai visitors
 *   DestinationFees.<destination>.guideForeign     required local guide fee per person, foreign visitors
 * Values are amounts in THB, e.g. "40", or free text like "Free". A missing or empty key is not
 * shown, and a destination with guide keys needs a local guide.
 */
const FEE_KEY_PREFIX = 'DestinationFees';
const FEE_TYPES = ['entrance', 'guide'];

const pickFeeValue = (messages, key) => {
  const value = messages?.[key];
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
};

/**
 * Get the fees paid on the day for a destination from the app's (hosted + local) messages.
 *
 * @param {Object} messages intl.messages
 * @param {string} destination option value, e.g. 'krokedokwaterfall'
 * @returns {{ entrance: { thai: string|null, foreign: string|null }|null,
 *   guide: { thai: string|null, foreign: string|null }|null }|null}
 *   null when no destination is selected or it has no fees
 */
export const getDestinationFees = (messages, destination) => {
  if (!destination || typeof destination !== 'string') {
    return null;
  }
  const fees = FEE_TYPES.reduce((picked, type) => {
    const base = `${FEE_KEY_PREFIX}.${destination}.${type}`;
    const thai = pickFeeValue(messages, `${base}Thai`);
    const foreign = pickFeeValue(messages, `${base}Foreign`);
    return { ...picked, [type]: thai || foreign ? { thai, foreign } : null };
  }, {});
  return fees.entrance || fees.guide ? fees : null;
};

/**
 * Format a fee value: amounts like "40" or "1,200" become "฿40" / "฿1,200"; anything else (e.g.
 * "Free") is shown as written.
 *
 * @param {Object} intl react-intl object
 * @param {string} value
 * @returns {string}
 */
export const formatFeeValue = (intl, value) => {
  const normalized = `${value}`.replace(/,/g, '').trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return `${value}`;
  }
  const amount = Number(normalized);
  return intl.formatNumber(amount, {
    style: 'currency',
    currency: 'THB',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  });
};
