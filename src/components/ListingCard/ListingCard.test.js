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

  it('shows the price per seat instead of "(EUR)" when the built-in price is in another currency', () => {
    const config = getConfig();
    const { Money } = require('../../util/sdkLoader').types;
    const listing = createListing(
      'listing1',
      {
        price: new Money(100000, 'EUR'),
        publicData: { listingType: 'test-trip-booking', priceperseat: 1000 },
      },
      { author: createUser('user1') }
    );
    const { getByRole, getByText } = render(<ListingCard listing={listing} />, {
      config,
      messages: {
        'ListingCard.pricePerSeat': '฿{priceValue} / seat',
        'ListingCard.badge.licensedOperator': 'Licensed operator',
      },
    });
    expect(getByRole('link')).toHaveTextContent('฿1,000 / seat');
    expect(getByRole('link')).not.toHaveTextContent('(EUR)');
    expect(getByText('Licensed operator')).toBeInTheDocument();
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
        'ListingCard.seatsUpTo': '{count, plural, one {Up to # seat} other {Up to # seats}}',
      },
    });
    const card = getByRole('link');
    expect(card).toHaveTextContent('Local host');
    expect(card).toHaveTextContent('Sat 15 Nov 07:00 · Departs Ekkamai');
    expect(card).toHaveTextContent('฿350 / seat');
    expect(card).toHaveTextContent('Up to 3 seats');
    expect(card.querySelector('.seatsLow')).not.toBeNull();
  });

  it('shows "Up to N seats" without the warning color when there are more than 3 seats', () => {
    const config = getConfig();
    const listing = createListing(
      'listing1',
      { price: null, publicData: { listingType: 'local-host-trip', seatsavailable: 8 } },
      { author: createUser('user1') }
    );
    const { getByRole } = render(<ListingCard listing={listing} />, {
      config,
      messages: {
        'ListingCard.seatsUpTo': '{count, plural, one {Up to # seat} other {Up to # seats}}',
      },
    });
    const card = getByRole('link');
    expect(card).toHaveTextContent('Up to 8 seats');
    expect(card.querySelector('.seatsLow')).toBeNull();
  });

  it('shows the host name and a verified mark only for verified hosts', () => {
    const config = getConfig();
    const messages = {
      'ListingCard.author': '{authorName}',
      'VerifiedHostMark.label': 'Verified host',
    };
    const verifiedHost = createUser('user1', {
      profile: {
        displayName: 'Nok',
        abbreviatedName: 'N',
        metadata: { verifiedhost: 'yes' },
      },
    });
    const otherHost = createUser('user2', {
      profile: { displayName: 'Bee', abbreviatedName: 'B', metadata: { verifiedhost: 'no' } },
    });

    const verified = render(
      <ListingCard listing={createListing('listing1', {}, { author: verifiedHost })} />,
      { config, messages }
    );
    const verifiedCard = verified.getByRole('link');
    expect(verifiedCard).toHaveTextContent('Nok');
    expect(verifiedCard).toHaveTextContent('Verified host');
    verified.unmount();

    const other = render(
      <ListingCard listing={createListing('listing2', {}, { author: otherHost })} />,
      { config, messages }
    );
    const otherCard = other.getByRole('link');
    expect(otherCard).toHaveTextContent('Bee');
    expect(otherCard).not.toHaveTextContent('Verified host');
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
