/**
 * beaway: listing types used only for testing the booking flow (default-booking without Stripe)
 * on localhost. They are added to the hosted (Console) listing types ONLY in development builds
 * (`yarn run dev`), so they never show up on Render (production build) and your Console
 * listing types stay untouched.
 *
 * Note: Console listing fields that are limited to specific listing types won't show for these
 * test types. That's fine for testing the booking flow (title, price, availability, seats).
 *
 * To stop using them, empty the array below or delete this file and its import in
 * src/util/configHelpers.js (mergeListingConfig).
 */
// Shared settings: booking without payments, one fixed-length trip, several seats.
const bookingTripSettings = {
  transactionType: {
    process: 'default-booking',
    alias: 'default-booking/release-1',
    unitType: 'fixed',
  },
  availabilityType: 'multipleSeats',
  priceVariations: {
    enabled: false,
  },
  defaultListingFields: {
    location: true,
    payoutDetails: false,
  },
};

// The listing type decides the card badge (see TRIP_BADGES in ListingCard.helpers.js).
// 'test-trip-booking' keeps its original key so listings already created with it still work.
const testListingTypes = [
  {
    listingType: 'test-trip-booking',
    label: 'TEST licensed operator booking (localhost only)',
    ...bookingTripSettings,
  },
  {
    listingType: 'test-local-host-booking',
    label: 'TEST local host booking (localhost only)',
    ...bookingTripSettings,
  },
];

/**
 * @returns {Array<Object>} test listing types in development builds, an empty array otherwise
 */
export const getBeawayTestListingTypes = () =>
  process.env.NODE_ENV === 'development' ? testListingTypes : [];
