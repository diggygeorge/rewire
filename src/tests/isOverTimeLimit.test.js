const isOverTimeLimit = require('./isOverTimeLimit');

describe('isOverTimeLimit', () => {
  // The user's restriction rules
  const sampleBlocks = [
    {
      "name": "Social Media",
      "type": "LIMIT",
      "website": [
        "www.instagram.com",
        "www.youtube.com"
      ],
      "times": [0, 60, 60, 60, 60, 30, 0] // Limits per day
    },
    {
      "name": "Other Thingy",
      "type": "LIMIT",
      "website": [
        "www.reddit.com"
      ],
      "times": [0, 0, 0, 0, 0, 0, 0] // 0-minute strict block
    }
  ];

  // The dummy map representing data pulled from chrome.storage
  const dummyScreenTimes = new Map([
    ["www.youtube.com", 45],
    ["www.instagram.com", 60],
    ["www.reddit.com", 1],
    ["www.google.com", 100],
    ["www.tiktok.com", 0] // Visited, but no time accumulated yet
  ]);

  it('should return false if the website is not in any limit block', () => {
    // Google has 100 mins in the dummy map, but isn't in sampleBlocks
    const result = isOverTimeLimit('www.google.com', sampleBlocks, 1, dummyScreenTimes);
    expect(result).toBe(false);
  });

  it('should return false if the usage is under the daily limit', () => {
    // YouTube has 45 mins in the map. Monday limit is 60.
    const result = isOverTimeLimit('www.youtube.com', sampleBlocks, 1, dummyScreenTimes);
    expect(result).toBe(false);
  });

  it('should return true if the usage exactly matches the daily limit', () => {
    // Instagram has exactly 60 mins in the map. Monday limit is 60.
    const result = isOverTimeLimit('www.instagram.com', sampleBlocks, 1, dummyScreenTimes);
    expect(result).toBe(true);
  });

  it('should block weekend usage if the limit is strictly lower', () => {
    // YouTube has 45 mins in the map. Friday limit is 30.
    const result = isOverTimeLimit('www.youtube.com', sampleBlocks, 5, dummyScreenTimes);
    expect(result).toBe(true);
  });

  it('should block immediately if the day has a 0-minute limit and usage > 0', () => {
    // YouTube has 45 mins in the map. Sunday limit is 0.
    const result = isOverTimeLimit('www.youtube.com', sampleBlocks, 0, dummyScreenTimes);
    expect(result).toBe(true);
  });

  it('should enforce a strict 0-minute block across all days for restricted sites', () => {
    // Reddit has 1 min in the map. Wednesday limit is 0.
    const result = isOverTimeLimit('www.reddit.com', sampleBlocks, 3, dummyScreenTimes);
    expect(result).toBe(true);
  });

  it('should allow usage if the site is in the limits array but has no time in the map yet', () => {
    // A site in the restricted list, but the user hasn't visited it today
    // (It's not in the map, so it defaults to 0)
    const result = isOverTimeLimit('www.instagram.com', sampleBlocks, 1, new Map());
    expect(result).toBe(false);
  });
});