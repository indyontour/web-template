import destinationContent from '../config/destinationContent';
import {
  formatFeeValue,
  getDestinationFees,
  getDestinationContent,
  getDestinationSuggestions,
  getItinerarySteps,
  getMeetingPointsFor,
  getLocalizedText,
} from './destinations';

describe('destinations', () => {
  it('has an entry with meeting points, itinerary and duration hint for every destination', () => {
    const keys = [
      'saladdaiwaterfall',
      'khaohuamuaktrail',
      'krokedokwaterfall',
      'chedkhotwaterfall',
      'khaochalak',
    ];
    expect(Object.keys(destinationContent).sort()).toEqual([...keys].sort());
    keys.forEach(key => {
      const entry = destinationContent[key];
      expect(entry.meetingPoints).toHaveLength(4);
      expect(entry.itinerary.en).not.toMatch(/Host:/);
      expect(entry.durationHint.en).toBeTruthy();
    });
  });

  it('getDestinationContent returns null for missing or unknown destinations', () => {
    expect(getDestinationContent(undefined)).toBeNull();
    expect(getDestinationContent('')).toBeNull();
    expect(getDestinationContent('atlantis')).toBeNull();
    expect(getDestinationContent('toString')).toBeNull();
    expect(getDestinationContent('khaochalak')).toBe(destinationContent.khaochalak);
  });

  it('getLocalizedText falls back to en when th is missing', () => {
    expect(getLocalizedText({ en: 'Hi', th: null }, 'th')).toBe('Hi');
    expect(getLocalizedText({ en: 'Hi', th: 'สวัสดี' }, 'th-TH')).toBe('สวัสดี');
    expect(getLocalizedText({ en: 'Hi', th: 'สวัสดี' }, 'en')).toBe('Hi');
    expect(getLocalizedText(null, 'en')).toBeNull();
  });

  it('getItinerarySteps returns the dash lines only', () => {
    expect(getItinerarySteps('Plan:\n- Walk.\n- Swim.')).toEqual(['Walk.', 'Swim.']);
    expect(getItinerarySteps('Plan only')).toEqual([]);
    expect(getItinerarySteps(null)).toEqual([]);
  });

  it('getDestinationSuggestions returns form-ready content', () => {
    const s = getDestinationSuggestions('khaochalak', 'en');
    expect(s.meetingPoints).toEqual([
      'Ekkamai Bus Terminal',
      'On Nut BTS',
      'Thonglor BTS',
      'Ari BTS',
    ]);
    expect(s.steps).toEqual([
      'Meet at the departure point and drive to Khao Chalak (about 1.5 hrs).',
      'Walk or run the trail at a pace the group is comfortable with.',
      'Rest, snacks and views.',
      'Drive back to Bangkok.',
    ]);
    expect(s.durationHint).toMatch(/6 to 8 hrs/);
    expect(getDestinationSuggestions('nowhere', 'en')).toBeNull();
  });

  describe('destination fees', () => {
    const messages = {
      'DestinationFees.krokedokwaterfall.entranceThai': '40',
      'DestinationFees.krokedokwaterfall.entranceForeign': ' 200 ',
      'DestinationFees.krokedokwaterfall.guideThai': '100',
      'DestinationFees.krokedokwaterfall.guideForeign': '',
      'DestinationFees.khaochalak.entranceThai': '',
      'DestinationFees.khaochalak.entranceForeign': '',
      'DestinationFees.saladdaiwaterfall.entranceThai': 'Free',
    };

    it('getDestinationFees picks the filled-in fees for a destination', () => {
      expect(getDestinationFees(messages, 'krokedokwaterfall')).toEqual({
        entrance: { thai: '40', foreign: '200' },
        guide: { thai: '100', foreign: null },
      });
      expect(getDestinationFees(messages, 'saladdaiwaterfall')).toEqual({
        entrance: { thai: 'Free', foreign: null },
        guide: null,
      });
    });

    it('getDestinationFees returns null when nothing is set', () => {
      expect(getDestinationFees(messages, 'khaochalak')).toBeNull();
      expect(getDestinationFees(messages, 'notconfigured')).toBeNull();
      expect(getDestinationFees(messages, undefined)).toBeNull();
      expect(getDestinationFees(undefined, 'krokedokwaterfall')).toBeNull();
    });

    it('formatFeeValue formats amounts as THB and keeps other text', () => {
      const intl = { formatNumber: (n, o) => `${o.currency}:${n}` };
      expect(formatFeeValue(intl, '40')).toBe('THB:40');
      expect(formatFeeValue(intl, '1,200')).toBe('THB:1200');
      expect(formatFeeValue(intl, '40.5')).toBe('THB:40.5');
      expect(formatFeeValue(intl, 'Free')).toBe('Free');
    });
  });

  it("getMeetingPointsFor lists all 6 points, the destination's own first", () => {
    expect(getMeetingPointsFor('khaochalak')).toEqual([
      'Ekkamai Bus Terminal',
      'On Nut BTS',
      'Thonglor BTS',
      'Ari BTS',
      'Mo Chit BTS',
      'Victory Monument',
    ]);
    expect(getMeetingPointsFor('krokedokwaterfall').slice(0, 4)).toEqual(
      destinationContent.krokedokwaterfall.meetingPoints
    );
    expect(getMeetingPointsFor(undefined)).toEqual([
      'Mo Chit BTS',
      'Ekkamai Bus Terminal',
      'Victory Monument',
      'Ari BTS',
      'On Nut BTS',
      'Thonglor BTS',
    ]);
    expect(getMeetingPointsFor('notconfigured')).toHaveLength(6);
    // The config lists stay as they are
    expect(destinationContent.khaochalak.meetingPoints).toHaveLength(4);
  });
});
