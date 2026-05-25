// Player avatar URLs for Bundesliga stars — used in prediction cards
// These are Wikipedia commons images (public domain / CC licensed)

const PLAYERS = {
  'julian brandt': 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Julian_Brandt_2014.jpg',
  'brandt': 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Julian_Brandt_2014.jpg',
  'karim adeyemi': 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Karim_Adeyemi_%28Red_Bull_Salzburg%2C_01.12.2020%29.jpg',
  'adeyemi': 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Karim_Adeyemi_%28Red_Bull_Salzburg%2C_01.12.2020%29.jpg',
  'serhou guirassy': 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Serhou_guirassy.jpg',
  'guirassy': 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Serhou_guirassy.jpg',
  'jamal musiala': 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Jamal_Musiala_2022_%28cropped%29.jpg',
  'musiala': 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Jamal_Musiala_2022_%28cropped%29.jpg',
  'harry kane': 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Harry_Kane_%2835805453874%29.jpg',
  'kane': 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Harry_Kane_%2835805453874%29.jpg',
  'leroy sané': 'https://upload.wikimedia.org/wikipedia/commons/4/4c/20180602_FIFA_Friendly_Match_Austria_vs._Germany_Leroy_San%C3%A9_850_0723.jpg',
  'sané': 'https://upload.wikimedia.org/wikipedia/commons/4/4c/20180602_FIFA_Friendly_Match_Austria_vs._Germany_Leroy_San%C3%A9_850_0723.jpg',
  'marco reus': 'https://upload.wikimedia.org/wikipedia/commons/6/63/Marco_Reus%2C_2019.jpg',
  'reus': 'https://upload.wikimedia.org/wikipedia/commons/6/63/Marco_Reus%2C_2019.jpg',
  'florian wirtz': 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Florian_Wirtz_2022.jpg',
  'wirtz': 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Florian_Wirtz_2022.jpg'
}

export function getPlayerAvatar(name) {
  if (!name) return null
  const key = name.toLowerCase().trim()
  const match = Object.keys(PLAYERS).find((k) => key.includes(k) || k.includes(key))
  return match ? PLAYERS[match] : null
}
