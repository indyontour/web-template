/**
 * beaway: content for each Destination (listing field `destination`, select one), keyed by the
 * field's option value. Used in the create/edit listing form (details step) and on the listing page.
 *
 * Nothing here is enforced on the host:
 * - meetingPoints  Tappable suggestions under the Departure point field (publicData.departurepoint)
 * - itinerary      The plan for the day. Its "- " lines are shown as numbered steps on the
 *                  listing page; other lines (like "Plan for the day:") are left out.
 * - durationHint   Hint under the Estimated trip length (hours) field (publicData.tripduration)
 *
 * itinerary and durationHint have `en` and `th` versions. A `th` of null falls back to `en`.
 */
const destinationContent = {
  saladdaiwaterfall: {
    meetingPoints: ['Mo Chit BTS', 'Ekkamai Bus Terminal', 'Victory Monument', 'Ari BTS'],
    itinerary: {
      en:
        'Plan for the day:\n- Meet at the departure point and drive to Salad Dai Waterfall (about 2 hrs).\n- Walk to the waterfall, swim or relax.\n- Lunch break.\n- Drive back to Bangkok.',
      th: null,
    },
    durationHint: {
      en: 'Most travelers are out for about 8 to 10 hrs from meeting to return.',
      th: null,
    },
  },
  khaohuamuaktrail: {
    meetingPoints: ['Mo Chit BTS', 'Ekkamai Bus Terminal', 'Victory Monument', 'Ari BTS'],
    itinerary: {
      en:
        'Plan for the day:\n- Meet at the departure point and drive to the trailhead (about 2 hrs).\n- Hike the trail at a pace the group is comfortable with.\n- Rest and lunch.\n- Hike back and drive to Bangkok.',
      th: null,
    },
    durationHint: {
      en: "Most travelers are out for about 8 to 10 hrs, depending on the group's pace.",
      th: null,
    },
  },
  krokedokwaterfall: {
    meetingPoints: ['Mo Chit BTS', 'Victory Monument', 'Ekkamai Bus Terminal', 'Ari BTS'],
    itinerary: {
      en:
        'Plan for the day:\n- Meet at the departure point and drive to Krok-E-Dok Waterfall (about 2 hrs).\n- Walk to the waterfall, swim or relax.\n- Lunch break.\n- Drive back to Bangkok.',
      th: null,
    },
    durationHint: {
      en: 'Most travelers are out for about 8 to 10 hrs from meeting to return.',
      th: null,
    },
  },
  chedkhotwaterfall: {
    meetingPoints: ['Mo Chit BTS', 'Victory Monument', 'Ekkamai Bus Terminal', 'Ari BTS'],
    itinerary: {
      en:
        'Plan for the day:\n- Meet at the departure point and drive to Ched Khot Waterfall (about 2 hrs).\n- Walk to the waterfall, swim or relax.\n- Lunch break.\n- Drive back to Bangkok.',
      th: null,
    },
    durationHint: {
      en: 'Most travelers are out for about 8 to 10 hrs from meeting to return.',
      th: null,
    },
  },
  khaochalak: {
    meetingPoints: ['Ekkamai Bus Terminal', 'On Nut BTS', 'Thonglor BTS', 'Ari BTS'],
    itinerary: {
      en:
        'Plan for the day:\n- Meet at the departure point and drive to Khao Chalak (about 1.5 hrs).\n- Walk or run the trail at a pace the group is comfortable with.\n- Rest, snacks and views.\n- Drive back to Bangkok.',
      th: null,
    },
    durationHint: {
      en: "Most travelers are out for about 6 to 8 hrs, depending on the group's pace.",
      th: null,
    },
  },
};

export default destinationContent;
