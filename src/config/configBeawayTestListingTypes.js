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
const testListingTypes = [
  {
    listingType: 'test-trip-booking',
    label: 'TEST trip booking (localhost only)',
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
  },
];

/**
 * @returns {Array<Object>} test listing types in development builds, an empty array otherwise
 */
export const getBeawayTestListingTypes = () =>
  process.env.NODE_ENV === 'development' ? testListingTypes : [];
