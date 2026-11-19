import React from 'react';
import '@testing-library/jest-dom';

import { getHostedConfiguration, renderWithProviders as render } from '../../util/testHelpers';
import { createUser, createListing, fakeIntl } from '../../util/testData';

import { ListingCard } from './ListingCard';

const getConfig = () => {
  const hostedConfig = getHostedConfiguration();
  return {
    ...hostedConfig,
    listingTypes: {
      listingTypes: [
        {
          id: 'free-inquiry',
          transactionProcess: {
            name: 'default-inquiry',
            alias: 'default-inquiry/release-1',
          },
          unitType: 'inquiry',
          defaultListingFields: {
            price: false,
          },
        },
      ],
    },
  };
};

describe('ListingCard', () => {
  it('matches snapshot', () => {
    // This is quite small component what comes to rendered HTML
    // For now, we rely on snapshot-testing.
    const listing = createListing('listing1', {}, { author: createUser('user1') });
    const tree = render(<ListingCard listing={listing} intl={fakeIntl} />);
    expect(tree.asFragment().firstChild).toMatchSnapshot();
  });

  it('matches snapshot without price', () => {
    const config = getConfig();
    const listing = createListing(
      'listing1',
      { publicData: { listingType: 'free-inquiry' } },
      { author: createUser('user1') }
    );
    const tree = render(<ListingCard listing={listing} intl={fakeIntl} />, { config });
    expect(tree.asFragment().firstChild).toMatchSnapshot();
  });

  it('shows the beaway price per seat when there is no built-in price', () => {
    const config = getConfig();
    const listing = createListing(
      'listing1',
      { price: null, publicData: { listingType: 'free-inquiry', priceperseat: 2500 } },
      { author: createUser('user1') }
    );
    const { getByRole } = render(<ListingCard listing={listing} />, {
      config,
      messages: { 'ListingCard.pricePerSeat': '฿{priceValue} / seat' },
    });
    expect(getByRole('link')).toHaveTextContent('฿2,500 / seat');
  });

  it('shows the beaway trip badge, date, departure point and seats left', () => {
    const config = getConfig();
    const listing = createListing(
      'listing1',
      {
        price: null,
        publicData: {
          listingType: 'local-host-trip',
          priceperseat: 350,
          tripdateandtime: 'Sat 15 Nov 07:00',
          departurepoint: 'Ekkamai',
          seatsavailable: 3,
        },
      },
      { author: createUser('user1') }
    );
    const { getByRole } = render(<ListingCard listing={listing} />, {
      config,
      messages: {
        'ListingCard.pricePerSeat': '฿{priceValue} / seat',
        'ListingCard.badge.localHost': 'Local host',
        'ListingCard.departs': 'Departs {point}',
        'ListingCard.seatsLeft': '{count, plural, one {# seat left} other {# seats left}}',
      },
    });
    const card = getByRole('link');
    expect(card).toHaveTextContent('Local host');
    expect(card).toHaveTextContent('Sat 15 Nov 07:00 · Departs Ekkamai');
    expect(card).toHaveTextContent('฿350 / seat');
    expect(card).toHaveTextContent('3 seats left');
  });

  it('shows "Full" and the licensed operator badge when no seats are left', () => {
    const config = getConfig();
    const listing = createListing(
      'listing1',
      {
        price: null,
        publicData: { listingType: 'licensed-operator-trip', seatsavailable: 0 },
      },
      { author: createUser('user1') }
    );
    const { getByRole } = render(<ListingCard listing={listing} />, {
      config,
      messages: {
        'ListingCard.badge.licensedOperator': 'Licensed operator',
        'ListingCard.seatsFull': 'Full',
      },
    });
    const card = getByRole('link');
    expect(card).toHaveTextContent('Licensed operator');
    expect(card).toHaveTextContent('Full');
    expect(card).not.toHaveTextContent('Departs');
  });

  it('shows no price line when price per seat is missing or not a number', () => {
    const config = getConfig();
    const listing = createListing(
      'listing1',
      { price: null, publicData: { listingType: 'free-inquiry', priceperseat: 'ask host' } },
      { author: createUser('user1') }
    );
    const { getByRole } = render(<ListingCard listing={listing} />, {
      config,
      messages: { 'ListingCard.pricePerSeat': '฿{priceValue} / seat' },
    });
    expect(getByRole('link')).not.toHaveTextContent('/ seat');
  });
});
