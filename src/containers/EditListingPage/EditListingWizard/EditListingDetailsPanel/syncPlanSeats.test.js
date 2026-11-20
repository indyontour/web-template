import { syncPlanSeatsWithSeatsAvailable } from './EditListingDetailsPanel';

const listingWithPlan = seats => ({
  attributes: {
    availabilityPlan: {
      type: 'availability-plan/time',
      timezone: 'Asia/Bangkok',
      entries: [{ dayOfWeek: 'sat', startTime: '07:30', endTime: '17:00', seats }],
    },
  },
});

describe('syncPlanSeatsWithSeatsAvailable (beaway)', () => {
  it('sets the weekly schedule seats to the "Seats available" value for booking trips', () => {
    const result = syncPlanSeatsWithSeatsAvailable(
      listingWithPlan(1),
      5,
      'default-booking/release-1'
    );
    expect(result.availabilityPlan.entries).toEqual([
      { dayOfWeek: 'sat', startTime: '07:30', endTime: '17:00', seats: 5 },
    ]);
    expect(result.availabilityPlan.timezone).toEqual('Asia/Bangkok');
  });

  it('accepts the seats as text', () => {
    const result = syncPlanSeatsWithSeatsAvailable(
      listingWithPlan(1),
      '3',
      'default-booking/release-1'
    );
    expect(result.availabilityPlan.entries[0].seats).toEqual(3);
  });

  it('changes nothing for messaging trips, missing seats, or seats that already match', () => {
    expect(
      syncPlanSeatsWithSeatsAvailable(listingWithPlan(1), 5, 'default-inquiry/release-1')
    ).toEqual({});
    expect(
      syncPlanSeatsWithSeatsAvailable(listingWithPlan(1), undefined, 'default-booking/release-1')
    ).toEqual({});
    expect(
      syncPlanSeatsWithSeatsAvailable(listingWithPlan(5), 5, 'default-booking/release-1')
    ).toEqual({});
    expect(
      syncPlanSeatsWithSeatsAvailable({ attributes: {} }, 5, 'default-booking/release-1')
    ).toEqual({});
  });
});
