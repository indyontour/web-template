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
  'licensed-operator-trip': { id: 'ListingCard.badge.licensedOperator', variant: 'licensedOperator' },
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

/**
 * beaway: trip details for the card, read from the Console listing fields
 * tripdateandtime, departurepoint and seatsavailable.
 *
 * @param {Object} listing - API entity: listing or ownListing
 * @param {Object} intl - React Intl instance
 * @returns {Object}
 *   - badge: { label, variant } or null ("Local host" / "Licensed operator")
 *   - tripDetails: e.g. "30 Nov at 7:00 AM · Departs Maya Mall", or ''
 *   - seatsLeft: { text, isFull } or null, e.g. "3 seats left" / "Full"
 */
export const getTripCardDetails = (listing, intl) => {
  const { publicData } = listing?.attributes || {};
  const { listingType, tripdateandtime, departurepoint, seatsavailable } = publicData || {};

  const badgeConfig = TRIP_BADGES[listingType];
  const badge = badgeConfig
    ? { label: intl.formatMessage({ id: badgeConfig.id }), variant: badgeConfig.variant }
    : null;

  const date = cleanText(tripdateandtime);
  const point = cleanText(departurepoint);
  const departs = point ? intl.formatMessage({ id: 'ListingCard.departs' }, { point }) : '';
  const tripDetails = [date, departs].filter(Boolean).join(' · ');

  const seats = parseSeats(seatsavailable);
  const seatsLeft =
    seats == null
      ? null
      : seats === 0
      ? { text: intl.formatMessage({ id: 'ListingCard.seatsFull' }), isFull: true }
      : {
          text: intl.formatMessage({ id: 'ListingCard.seatsLeft' }, { count: seats }),
          isFull: false,
        };

  return { badge, tripDetails, seatsLeft };
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
    ? intl.formatMessage({ id: 'ListingCard.perUnit' }, { unitType: publicData?.unitType })
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
  const seatPrice = builtInPriceMessagePlain ? null : parseSeatPrice(publicData?.priceperseat);
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
