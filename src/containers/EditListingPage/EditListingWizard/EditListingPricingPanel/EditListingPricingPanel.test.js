import { types as sdkTypes } from '../../../../util/sdkLoader';

import { clearPricesInOtherCurrency } from './EditListingPricingPanel';

const { Money } = sdkTypes;

describe('clearPricesInOtherCurrency (beaway)', () => {
  it('empties prices saved in another currency so the host can type them again', () => {
    const values = clearPricesInOtherCurrency(
      {
        priceVariants: [{ price: new Money(100000, 'USD'), bookingLengthInMinutes: 420 }],
        startTimeInterval: 'hour',
      },
      'THB'
    );
    expect(values.priceVariants).toEqual([{ price: null, bookingLengthInMinutes: 420 }]);
    expect(values.startTimeInterval).toEqual('hour');
    expect(clearPricesInOtherCurrency({ price: new Money(500, 'USD') }, 'THB').price).toBeNull();
  });

  it('keeps prices that are already in the marketplace currency', () => {
    const price = new Money(250000, 'THB');
    expect(clearPricesInOtherCurrency({ price }, 'THB').price).toBe(price);
    expect(clearPricesInOtherCurrency({ priceVariants: [{ price }] }, 'THB')).toEqual({
      priceVariants: [{ price }],
    });
  });
});
