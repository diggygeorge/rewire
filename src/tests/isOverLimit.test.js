const isOverLimit = require('./isOverLimit');

describe('isOverLimit', () => {
    // Sample data based on your provided structure
    const sampleBlocks = [
        {
            "name": "Social Media",
            "website": [
                "www.instagram.com",
                "www.youtube.com"
            ],
            "times": [
                { "start": -1, "end": -1 },    // 0: Sunday (Disabled)
                { "start": 30, "end": 420 },   // 1: Monday (12:30 AM - 7:00 AM)
                { "start": 30, "end": 420 },   // 2: Tuesday
                { "start": 30, "end": 420 },   // 3: Wednesday
                { "start": 30, "end": 420 },   // 4: Thursday
                { "start": 30, "end": 420 },   // 5: Friday
                { "start": -1, "end": -1 }     // 6: Saturday (Disabled)
            ]
        },
        {
            "name": "Night Owl Block",
            "website": [
                "www.reddit.com"
            ],
            "times": [
                { "start": -1, "end": -1 },    // 0: Sunday
                { "start": 1320, "end": 120 }, // 1: Monday (10:00 PM to 2:00 AM)
                { "start": -1, "end": -1 },    // 2: Tuesday
                { "start": -1, "end": -1 },    // 3: Wednesday
                { "start": -1, "end": -1 },    // 4: Thursday
                { "start": -1, "end": -1 },    // 5: Friday
                { "start": -1, "end": -1 }     // 6: Saturday
            ]
        }
    ];

    test('returns false if blocks array is null or undefined', () => {
        expect(isOverLimit('www.instagram.com', '12:00:00', 1, null)).toBe(false);
        expect(isOverLimit('www.instagram.com', '12:00:00', 1, undefined)).toBe(false);
    });

    test('returns false if the site is not in any block', () => {
        expect(isOverLimit('www.google.com', '04:00:00', 1, sampleBlocks)).toBe(false);
    });

    test('returns false if the day is disabled (start is -1)', () => {
        // Sunday (day 0) is disabled for Social Media
        expect(isOverLimit('www.instagram.com', '04:00:00', 0, sampleBlocks)).toBe(false);
    });

    test('returns true if time is strictly inside a normal interval', () => {
        // Monday (day 1), 04:00:00 is 240 minutes (between 30 and 420)
        expect(isOverLimit('www.youtube.com', '04:00:00', 1, sampleBlocks)).toBe(true);
    });

    test('returns false if time is before a normal interval', () => {
        // Monday, 00:15:00 is 15 minutes (before 30)
        expect(isOverLimit('www.youtube.com', '00:15:00', 1, sampleBlocks)).toBe(false);
    });

    test('returns false if time is after a normal interval', () => {
        // Monday, 08:00:00 is 480 minutes (after 420)
        expect(isOverLimit('www.youtube.com', '08:00:00', 1, sampleBlocks)).toBe(false);
    });

    test('returns true if time is inside an interval that crosses midnight (before midnight)', () => {
        // Monday, 23:00:00 is 1380 minutes (> 1320)
        expect(isOverLimit('www.reddit.com', '23:00:00', 1, sampleBlocks)).toBe(true);
    });

    test('returns true if time is inside an interval that crosses midnight (after midnight)', () => {
        // Tuesday, 01:00:00 is 60 minutes (< 120) still blocks due to restriction from Monday
        expect(isOverLimit('www.reddit.com', '01:00:00', 2, sampleBlocks)).toBe(true);
    });

    test('returns false if time is outside an interval that crosses midnight', () => {
        // Monday, 12:00:00 is 720 minutes (not > 1320 and not < 120)
        expect(isOverLimit('www.reddit.com', '12:00:00', 1, sampleBlocks)).toBe(false);
    });
});