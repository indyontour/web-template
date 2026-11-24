import { createIntl } from '../../util/reactIntl';
import enMessages from '../../translations/en.json';
import {
  MIN_NOTICE_HOURS,
  getEarliestBookingStart,
  clipTimeSlotsToEarliestStart,
  clipKeyedTimeSlotsToEarliestStart,
} from './booking.shared';

const HOUR = 60 * 60 * 1000;

// Rules in the default-booking process (ext/transaction-processes/default-booking/process.edn)
const PROCESS_EXPIRES_AFTER_SENDING_HOURS = 24;
const PROCESS_EXPIRES_BEFORE_DEPARTURE_HOURS = 12;

const timeSlot = (start, end, seats = 5) => ({
  id: { uuid: `${start.toISOString()}-${end.toISOString()}` },
  type: 'timeSlot',
  attributes: { start, end, seats, type: 'time-slot/time' },
});

describe('booking minimum notice (beaway)', () => {
  const now = new Date('2026-11-24T00:00:00.000Z');
  const hoursFromNow = hours => new Date(now.getTime() + hours * HOUR);
  const earliest = getEarliestBookingStart(MIN_NOTICE_HOURS, now);

  it('is 24 hours, and the earliest start is that far from now', () => {
    expect(MIN_NOTICE_HOURS).toEqual(24);
    expect(earliest.getTime() - now.getTime()).toEqual(MIN_NOTICE_HOURS * HOUR);
  });

  it('shows MIN_NOTICE_HOURS in both English texts (24 hours)', () => {
    const intl = createIntl({ locale: 'en', messages: enMessages });
    const notice = intl.formatMessage(
      { id: 'BookingFixedDurationForm.minimumNotice' },
      { hours: MIN_NOTICE_HOURS }
    );
    const error = intl.formatMessage(
      { id: 'BookingFixedDurationForm.minimumNoticeError' },
      { hours: MIN_NOTICE_HOURS }
    );
    expect(notice).toEqual(
      "Trips must be requested at least 24 hours before departure. Departures that are sooner aren't shown."
    );
    expect(error).toEqual(
      'This trip now departs in less than 24 hours, so it can no longer be requested. Please pick a later date.'
    );
  });

  it('uses MIN_NOTICE_HOURS by default', () => {
    const before = Date.now();
    const defaultEarliest = getEarliestBookingStart().getTime();
    const after = Date.now();
    expect(defaultEarliest).toBeGreaterThanOrEqual(before + MIN_NOTICE_HOURS * HOUR);
    expect(defaultEarliest).toBeLessThanOrEqual(after + MIN_NOTICE_HOURS * HOUR);
  });

  it('removes trips that depart sooner than the minimum notice', () => {
    const tooSoon = timeSlot(hoursFromNow(2), hoursFromNow(9));
    const sameDayButTooSoon = timeSlot(hoursFromNow(14), hoursFromNow(21));
    const endsAtCutOff = timeSlot(
      hoursFromNow(MIN_NOTICE_HOURS - 7),
      hoursFromNow(MIN_NOTICE_HOURS)
    );
    expect(
      clipTimeSlotsToEarliestStart([tooSoon, sameDayButTooSoon, endsAtCutOff], earliest)
    ).toEqual([]);
  });

  it('cuts the start of a time slot that crosses the cut-off, so a trip that no longer fits is dropped later', () => {
    const slot = timeSlot(hoursFromNow(MIN_NOTICE_HOURS - 2), hoursFromNow(MIN_NOTICE_HOURS + 5));
    const [clipped] = clipTimeSlotsToEarliestStart([slot], earliest);
    expect(clipped.attributes.start).toEqual(earliest);
    expect(clipped.attributes.end).toEqual(slot.attributes.end);
    expect(clipped.attributes.seats).toEqual(5);
  });

  it('keeps trips that depart at or after the minimum notice unchanged', () => {
    const exactly = timeSlot(earliest, new Date(earliest.getTime() + 7 * HOUR));
    const later = timeSlot(
      hoursFromNow(MIN_NOTICE_HOURS + 18),
      hoursFromNow(MIN_NOTICE_HOURS + 25),
      3
    );
    expect(clipTimeSlotsToEarliestStart([exactly, later], earliest)).toEqual([exactly, later]);
  });

  it('works on time slots keyed by month or date and keeps the other data', () => {
    const tooSoon = timeSlot(hoursFromNow(2), hoursFromNow(9));
    const later = timeSlot(hoursFromNow(MIN_NOTICE_HOURS + 6), hoursFromNow(MIN_NOTICE_HOURS + 13));
    const keyed = {
      '2026-11': { timeSlots: [tooSoon, later], fetchTimeSlotsInProgress: false },
      '2026-12': { fetchTimeSlotsInProgress: true },
    };
    expect(clipKeyedTimeSlotsToEarliestStart(keyed, earliest)).toEqual({
      '2026-11': { timeSlots: [later], fetchTimeSlotsInProgress: false },
      '2026-12': { fetchTimeSlotsInProgress: true },
    });
  });

  it('changes nothing when no cut-off is given', () => {
    const slots = [timeSlot(hoursFromNow(1), hoursFromNow(2))];
    expect(clipTimeSlotsToEarliestStart(slots, null)).toBe(slots);
  });

  it('gives the host at least 12 hours to answer any request the form allows', () => {
    // A request sent now for the soonest departure the form offers expires at whichever comes
    // first: 24 h after sending, or 12 h before departure.
    const departure = earliest;
    const expiresAt = Math.min(
      now.getTime() + PROCESS_EXPIRES_AFTER_SENDING_HOURS * HOUR,
      departure.getTime() - PROCESS_EXPIRES_BEFORE_DEPARTURE_HOURS * HOUR
    );
    expect(expiresAt - now.getTime()).toBeGreaterThanOrEqual(12 * HOUR);
    // ...and the 12-hours-before-departure expiry always still lies ahead, so the
    // "late request waits until departure" path is never used.
    expect(departure.getTime() - PROCESS_EXPIRES_BEFORE_DEPARTURE_HOURS * HOUR).toBeGreaterThan(
      now.getTime()
    );
  });
});
