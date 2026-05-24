// Service for resolving player photos and team logos (badges) using Sofascore CDN format.

const TEAM_MAP = {
  'borussia dortmund': 26,
  'bvb': 26,
  'dortmund': 26,
  'fc bayern münchen': 2678,
  'fc bayern munchen': 2678,
  'bayern munich': 2678,
  'bayern': 2678,
  'bayer 04 leverkusen': 2832,
  'bayer leverkusen': 2832,
  'leverkusen': 2832,
  'rb leipzig': 2836,
  'leipzig': 2836
};

const PLAYER_MAP = {
  'julian brandt': 147365,
  'brandt': 147365,
  'karim adeyemi': 923363,
  'adeyemi': 923363,
  'serhou guirassy': 803893,
  'guirassy': 803893,
  'jamal musiala': 966453,
  'musiala': 966453,
  'harry kane': 122588,
  'kane': 122588
};

export function getTeamLogoUrl(teamName) {
  if (!teamName) return '';
  const key = teamName.toLowerCase().trim();
  const id = TEAM_MAP[key] || Object.keys(TEAM_MAP).find(k => key.includes(k) || k.includes(key)) ? TEAM_MAP[Object.keys(TEAM_MAP).find(k => key.includes(k) || k.includes(key))] : null;
  
  if (id) {
    return `https://api.sofascore.app/api/v1/team/${id}/image`;
  }
  // If not mapped, return a standard soccer logo placeholder or use a default hash-based UI identifier
  return `https://api.sofascore.app/api/v1/team/26/image`; // Fallback to Dortmund logo as demo
}

export function getPlayerPhotoUrl(playerName) {
  if (!playerName) return '';
  const key = playerName.toLowerCase().trim();
  const id = PLAYER_MAP[key] || Object.keys(PLAYER_MAP).find(k => key.includes(k) || k.includes(key)) ? PLAYER_MAP[Object.keys(PLAYER_MAP).find(k => key.includes(k) || k.includes(key))] : null;

  if (id) {
    return `https://api.sofascore.app/api/v1/player/${id}/image`;
  }
  // Return a fallback player profile avatar or placeholder
  return `https://api.sofascore.app/api/v1/player/122588/image`; // Fallback to Kane photo as demo
}
