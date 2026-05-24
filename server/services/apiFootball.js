// Service for fetching live scores from API-Football.
// Supports both direct API-Sports and RapidAPI integrations.

const API_KEY = process.env.API_FOOTBALL_API_KEY || process.env.API_FOOTBALL_KEY;
const API_HOST = process.env.API_FOOTBALL_HOST || 'v3.football.api-sports.io'; // or api-football-v1.p.rapidapi.com

export async function fetchLiveScores() {
  if (!API_KEY) {
    console.warn('[apiFootball] API_FOOTBALL_API_KEY not configured. Falling back to local matches.');
    return null;
  }

  const isRapidAPI = API_HOST.includes('rapidapi');
  const baseUrl = isRapidAPI 
    ? 'https://api-football-v1.p.rapidapi.com/v3'
    : 'https://v3.football.api-sports.io';

  const headers = {
    'Content-Type': 'application/json'
  };

  if (isRapidAPI) {
    headers['x-rapidapi-key'] = API_KEY;
    headers['x-rapidapi-host'] = API_HOST;
  } else {
    headers['x-apisports-key'] = API_KEY;
  }

  try {
    // League 78 is German Bundesliga
    const url = `${baseUrl}/fixtures?live=all&league=78`;
    console.log(`[apiFootball] Fetching live Bundesliga matches from ${url}`);
    
    const res = await fetch(url, { headers, timeout: 5000 });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    if (json.errors && Object.keys(json.errors).length > 0) {
      throw new Error(JSON.stringify(json.errors));
    }

    return json.response || [];
  } catch (err) {
    console.error('[apiFootball] Error fetching live scores:', err.message);
    return null;
  }
}

// Maps Api-football live fixture response to our match schema format
export function mapFixtureToMatch(fixtureData) {
  if (!fixtureData) return null;
  const { fixture, teams, goals } = fixtureData;
  return {
    id: `live_${fixture.id}`,
    home_team: teams.home.name,
    away_team: teams.away.name,
    home_score: goals.home ?? 0,
    away_score: goals.away ?? 0,
    minute: fixture.status.elapsed ?? 0,
    status: mapStatus(fixture.status.short),
    stadium: fixture.venue.name || 'Unknown Stadium',
    matchday: fixtureData.league.round ? parseInt(fixtureData.league.round.match(/\d+/)?.[0] || '1', 10) : 1,
    started_at: fixture.date,
    home_team_logo: teams.home.logo,
    away_team_logo: teams.away.logo
  };
}

function mapStatus(shortStatus) {
  // short status code mapping: 1H, 2H, HT, etc. -> 'live'
  // FT, AET, PEN -> 'finished'
  // NS -> 'upcoming'
  const liveStatuses = ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'];
  const finishedStatuses = ['FT', 'AET', 'PEN'];
  
  if (liveStatuses.includes(shortStatus)) return 'live';
  if (finishedStatuses.includes(shortStatus)) return 'finished';
  return 'upcoming';
}
