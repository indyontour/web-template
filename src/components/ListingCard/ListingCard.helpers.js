import { displayPrice, isPriceVariationsEnabled } from '../../util/configHelpers';
import { formatMoney } from '../../util/currency';
import { richText } from '../../util/richText';
import { isBookingProcessAlias } from '../../transactions/transaction';

import css from './ListingCard.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 10;

const priceData = (price, currency, intl) => {
  if (price && price.currency === currency) {
    const formattedPrice = formatMoney(intl, price);
    return { formattedPrice, priceTooltip: formattedPrice };
  } else if (price) {
    return {
      formattedPrice: intl.formatMessage(
        { id: 'ListingCard.unsupportedPrice' },
        { currency: price.currency }
      ),
      priceTooltip: intl.formatMessage(
        { id: 'ListingCard.unsupportedPriceTitle' },
        { currency: price.currency }
      ),
    };
  }
  return {};
};

// beaway: turn the "Price per seat (THB)" value into a number.
// Accepts a number (2500) or digits-only text ("2500", "2,500"); anything else is ignored.
const parseSeatPrice = value => {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  if (typeof value === 'string') {
    const digits = value.trim().replace(/,/g, '');
    return /^\d+$/.test(digits) && Number(digits) > 0 ? Number(digits) : null;
  }
  return null;
};

// beaway: label shown at the top of each trip card, by listing type.
const TRIP_BADGES = {
  'local-host-trip': { id: 'ListingCard.badge.localHost', variant: 'localHost' },
  'licensed-operator-trip': {
    id: 'ListingCard.badge.licensedOperator',
    variant: 'licensedOperator',
  },
};

const cleanText = value => (typeof value === 'string' ? value.trim() : '');

const parseSeats = value => {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return value;
  }
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    return Number(value.trim());
  }
  return null;
};

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * beaway: tidy the free-text "Trip date and time" field so every card looks the same.
 * Understands e.g. "Nov 18 / 7.00 AM", "30 Nov at 7:00 AM", "18 Nov / 07.00 AM", "18 November 7am"
 * and turns them into "18 Nov · 7:00 AM". Text it can't read is shown as the host typed it.
 *
 * @param {string} text trip date and time typed by the host
 * @returns {string} tidied text
 */
export const formatTripDate = text => {
  if (!text) {
    return '';
  }
  const monthMatch = text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?/i);
  // The day is a 1–2 digit number right before or after the month name
  const dayMatch =
    text.match(
      /\b(\d{1,2})(?:st|nd|rd|th)?\s+(?=(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))/i
    ) ||
    text.match(
      /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b/i
    );
  const timeMatch =
    text.match(/\b(\d{1,2})(?:[.:](\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)/i) ||
    text.match(/\b(\d{1,2})[.:](\d{2})\b/);

  const day = dayMatch ? Number(dayMatch[1]) : null;
  if (!monthMatch || !day || day > 31) {
    return text;
  }
  const month = MONTH_LABELS[MONTHS.indexOf(monthMatch[1].toLowerCase())];
  const date = `${day} ${month}`;
  if (!timeMatch) {
    return date;
  }
  const hours = Number(timeMatch[1]);
  const minutes = timeMatch[2] || '00';
  const period = timeMatch[3] ? timeMatch[3].replace(/\./g, '').toUpperCase() : null;
  const isValidTime = period ? hours >= 1 && hours <= 12 : hours <= 23;
  if (!isValidTime || Number(minutes) > 59) {
    return text;
  }
  const time = period
    ? `${hours}:${minutes} ${period}`
    : `${String(hours).padStart(2, '0')}:${minutes}`;
  return `${date} · ${time}`;
};

/**
 * beaway: trip details for the card, read from the Console listing fields
 * tripdateandtime, departurepoint and seatsavailable.
 *
 * @param {Object} listing - API entity: listing or ownListing
 * @param {Object} intl - React Intl instance
 * @returns {Object}
 *   - badge: { label, variant } or null ("Local host" / "Licensed operator")
 *   - tripDate: e.g. "30 Nov · 7:00 AM" (tidied when possible, otherwise as the host typed it), or ''
 *   - departurePoint: e.g. "Maya Mall", or ''
 *   - seatsLeft: { text, isFull, isLow } or null, e.g. "Up to 3 seats" / "Full".
 *     isLow is true for 1–3 seats (shown in the warning color).
 */
// beaway: "Up to N seats" turns orange when N is this or fewer
const LOW_SEATS_LIMIT = 3;

export const getTripCardDetails = (listing, intl) => {
  const { publicData } = listing?.attributes || {};
  const { listingType, tripdateandtime, departurepoint, seatsavailable } = publicData || {};

  const badgeConfig = TRIP_BADGES[listingType];
  const badge = badgeConfig
    ? { label: intl.formatMessage({ id: badgeConfig.id }), variant: badgeConfig.variant }
    : null;

  const tripDate = formatTripDate(cleanText(tripdateandtime));
  const departurePoint = cleanText(departurepoint);

  const seats = parseSeats(seatsavailable);
  const seatsLeft =
    seats == null
      ? null
      : seats === 0
      ? { text: intl.formatMessage({ id: 'ListingCard.seatsFull' }), isFull: true }
      : {
          text: intl.formatMessage({ id: 'ListingCard.seatsUpTo' }, { count: seats }),
          isFull: false,
          isLow: seats <= LOW_SEATS_LIMIT,
        };

  return { badge, tripDate, departurePoint, seatsLeft };
};

/**
 * Returns all translated and formatted strings for ListingCard so the
 * presentational component can stay simple and aria-labels use the same copy.
 *
 * @param {Object} listing - API entity: listing or ownListing
 * @param {Object} config - app configuration (e.g. from useConfiguration())
 * @param {Object} intl - React Intl instance (e.g. from useIntl())
 * @returns {Object} translations and derived values:
 *   - titlePlain: raw title string (for aria/alt)
 *   - titleFormatted: React nodes from richText(title) for display
 *   - showPrice: whether to show the price block
 *   - priceTooltip: string for the price element's title attribute (tooltip on hover)
 *   - priceMessage: React nodes for the price block content (styled amount + per-unit)
 *   - cardAriaLabel: ready-to-use aria-label for the card link (listing title + plain price line when shown)
 *   - authorName: "ListingCard.author" string containing author's display name
 */
export const getListingCardTranslations = (listing, config, intl) => {
  const { title = '', price, publicData } = listing?.attributes || {};

  const authorDisplayName = listing?.author?.attributes?.profile?.displayName;
  const authorName = intl.formatMessage(
    { id: 'ListingCard.author' },
    { authorName: authorDisplayName }
  );

  const validListingTypes = config.listing.listingTypes || [];
  const { listingType } = publicData || {};
  const listingTypeConfig = validListingTypes.find(conf => conf.listingType === listingType);

  const showPrice = displayPrice(listingTypeConfig);
  const { formattedPrice, priceTooltip } = priceData(price, config.currency, intl);

  const isPriceVariationsInUse = isPriceVariationsEnabled(publicData, listingTypeConfig);
  const hasMultiplePriceVariants = isPriceVariationsInUse && publicData?.priceVariants?.length > 1;
  const isBookable = isBookingProcessAlias(publicData?.transactionProcessAlias);

  const priceMessageId = hasMultiplePriceVariants
    ? 'ListingCard.priceStartingFrom'
    : 'ListingCard.price';

  const perUnitString = isBookable
    ? publicData?.unitType === 'fixed'
      ? // beaway: trips are priced per seat; own key so Console texts don't hide it
        intl.formatMessage({ id: 'ListingCard.perSeat' })
      : intl.formatMessage({ id: 'ListingCard.perUnit' }, { unitType: publicData?.unitType })
    : '';

  // Visible price block uses JSX spans for styling; aria-label needs a plain string.
  const priceValue = <span className={css.priceValue}>{formattedPrice}</span>;
  const pricePerUnit = isBookable ? <span className={css.perUnit}>{perUnitString}</span> : '';
  const priceMessage =
    showPrice && formattedPrice != null
      ? intl.formatMessage({ id: priceMessageId }, { priceValue, pricePerUnit })
      : '';

  const builtInPriceMessagePlain =
    showPrice && formattedPrice != null
      ? intl.formatMessage(
          { id: priceMessageId },
          { priceValue: formattedPrice, pricePerUnit: perUnitString }
        )
      : '';

  // beaway: trips have no built-in price; the price lives in the custom
  // "Price per seat (THB)" listing field (publicData.priceperseat).
  // Show it as e.g. "฿2,500 / seat" when there's no built-in price to show.
  // Also used when the built-in price was saved in another currency (e.g. USD before the
  // marketplace switched to THB), instead of showing "(USD)".
  const hasPriceInOtherCurrency = !!price && price.currency !== config.currency;
  const useBuiltInPrice = !!builtInPriceMessagePlain && !hasPriceInOtherCurrency;
  const seatPrice = useBuiltInPrice ? null : parseSeatPrice(publicData?.priceperseat);
  const seatPriceFormatted = seatPrice != null ? intl.formatNumber(seatPrice) : null;
  const seatPriceMessage =
    seatPriceFormatted != null
      ? intl.formatMessage(
          { id: 'ListingCard.pricePerSeat' },
          { priceValue: <span className={css.priceValue}>{seatPriceFormatted}</span> }
        )
      : null;
  const seatPriceMessagePlain =
    seatPriceFormatted != null
      ? intl.formatMessage({ id: 'ListingCard.pricePerSeat' }, { priceValue: seatPriceFormatted })
      : null;

  const priceMessagePlain = seatPriceMessagePlain || builtInPriceMessagePlain;

  const cardAriaLabel =
    priceMessagePlain.length > 0
      ? intl.formatMessage(
          { id: 'ListingCard.screenreader.label' },
          { listingTitle: title, formattedPrice: priceMessagePlain }
        )
      : title;

  return {
    titlePlain: title,
    titleFormatted: richText(title, {
      longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
      longWordClass: css.longWord,
    }),
    authorName,
    showPrice: seatPriceMessage ? true : showPrice,
    priceTooltip: seatPriceMessagePlain || priceTooltip,
    priceMessage: seatPriceMessage || priceMessage,
    cardAriaLabel,
  };
};
