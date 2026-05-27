// Service for resolving player photos and team logos (badges) using stable public image URLs.

const TEAM_MAP = {
  'borussia dortmund': 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
  'bvb': 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
  'dortmund': 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
  'fc bayern münchen': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
  'fc bayern munchen': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
  'bayern munich': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
  'bayern': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
  'bayer 04 leverkusen': 'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg',
  'bayer leverkusen': 'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg',
  'leverkusen': 'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg',
  'rb leipzig': 'https://assets.bundesliga.com/tachyon/background/club/layered-wide/DFL-CLU-000017.png?crop=10,30,80,40&resize=3000,680',
  'leipzig': 'https://assets.bundesliga.com/tachyon/background/club/layered-wide/DFL-CLU-000017.png?crop=10,30,80,40&resize=3000,680'
};

const PLAYER_MAP = {
  'julian brandt': 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Julian_Brandt_2014.jpg',
  'brandt': 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Julian_Brandt_2014.jpg',
  'karim adeyemi': 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Karim_Adeyemi_%28Red_Bull_Salzburg%2C_01.12.2020%29.jpg',
  'adeyemi': 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Karim_Adeyemi_%28Red_Bull_Salzburg%2C_01.12.2020%29.jpg',
  'serhou guirassy': 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Serhou_guirassy.jpg',
  'guirassy': 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Serhou_guirassy.jpg',
  'jamal musiala': 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Jamal_Musiala_2022_%28cropped%29.jpg',
  'musiala': 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Jamal_Musiala_2022_%28cropped%29.jpg',
  'harry kane': 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Harry_Kane_%2835805453874%29.jpg',
  'kane': 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Harry_Kane_%2835805453874%29.jpg'
};

export function getTeamLogoUrl(teamName) {
  if (!teamName) return '';
  const key = teamName.toLowerCase().trim();
  const matchedKey = Object.keys(TEAM_MAP).find(k => key.includes(k) || k.includes(key));
  
  if (matchedKey) {
    return TEAM_MAP[matchedKey];
  }
  return TEAM_MAP['borussia dortmund']; // default fallback
}

export function getPlayerPhotoUrl(playerName) {
  if (!playerName) return '';
  const key = playerName.toLowerCase().trim();
  const matchedKey = Object.keys(PLAYER_MAP).find(k => key.includes(k) || k.includes(key));

  if (matchedKey) {
    return PLAYER_MAP[matchedKey];
  }
  return PLAYER_MAP['harry kane']; // default fallback
}
