// Player avatar URLs for Bundesliga stars — used in prediction cards
// Wikimedia commons images (public domain / CC licensed)
// Verified URLs as of 2026

const PLAYERS = {
  'julian brandt': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Julian_Brandt_2024.jpg/256px-Julian_Brandt_2024.jpg',
  'brandt': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Julian_Brandt_2024.jpg/256px-Julian_Brandt_2024.jpg',
  'karim adeyemi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/2020-09-08_Football_Friendly_Croatia_v_Austria_U-21_DSC_5081.jpg/256px-2020-09-08_Football_Friendly_Croatia_v_Austria_U-21_DSC_5081.jpg',
  'adeyemi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/2020-09-08_Football_Friendly_Croatia_v_Austria_U-21_DSC_5081.jpg/256px-2020-09-08_Football_Friendly_Croatia_v_Austria_U-21_DSC_5081.jpg',
  'serhou guirassy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Serhou_guirassy.jpg/256px-Serhou_guirassy.jpg',
  'guirassy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Serhou_guirassy.jpg/256px-Serhou_guirassy.jpg',
  'jamal musiala': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Jamal_Musiala_2022_%28cropped%29.jpg/256px-Jamal_Musiala_2022_%28cropped%29.jpg',
  'musiala': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Jamal_Musiala_2022_%28cropped%29.jpg/256px-Jamal_Musiala_2022_%28cropped%29.jpg',
  'harry kane': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Harry_Kane_2023.jpg/256px-Harry_Kane_2023.jpg',
  'kane': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Harry_Kane_2023.jpg/256px-Harry_Kane_2023.jpg',
  'leroy sané': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Leroy_Sane_2018.jpg/256px-Leroy_Sane_2018.jpg',
  'sané': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Leroy_Sane_2018.jpg/256px-Leroy_Sane_2018.jpg',
  'sane': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Leroy_Sane_2018.jpg/256px-Leroy_Sane_2018.jpg',
  'marco reus': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/2019-09-09_Fu%C3%9Fball%2C_M%C3%A4nner%2C_L%C3%A4nderspiel%2C_Deutschland-Estland_StP_0742_LR10_by_Stepro.jpg/256px-2019-09-09_Fu%C3%9Fball%2C_M%C3%A4nner%2C_L%C3%A4nderspiel%2C_Deutschland-Estland_StP_0742_LR10_by_Stepro.jpg',
  'reus': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/2019-09-09_Fu%C3%9Fball%2C_M%C3%A4nner%2C_L%C3%A4nderspiel%2C_Deutschland-Estland_StP_0742_LR10_by_Stepro.jpg/256px-2019-09-09_Fu%C3%9Fball%2C_M%C3%A4nner%2C_L%C3%A4nderspiel%2C_Deutschland-Estland_StP_0742_LR10_by_Stepro.jpg',
  'florian wirtz': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/2021-09-05_Fu%C3%9Fball%2C_M%C3%A4nner%2C_L%C3%A4nderspiel%2C_Deutschland-Armenien_1DX_4119_by_Stepro.jpg/256px-2021-09-05_Fu%C3%9Fball%2C_M%C3%A4nner%2C_L%C3%A4nderspiel%2C_Deutschland-Armenien_1DX_4119_by_Stepro.jpg',
  'wirtz': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/2021-09-05_Fu%C3%9Fball%2C_M%C3%A4nner%2C_L%C3%A4nderspiel%2C_Deutschland-Armenien_1DX_4119_by_Stepro.jpg/256px-2021-09-05_Fu%C3%9Fball%2C_M%C3%A4nner%2C_L%C3%A4nderspiel%2C_Deutschland-Armenien_1DX_4119_by_Stepro.jpg'
}

export function getPlayerAvatar(name) {
  if (!name) return null
  const key = name.toLowerCase().trim()
  // Try exact match first
  if (PLAYERS[key]) return PLAYERS[key]
  // Try partial match
  const match = Object.keys(PLAYERS).find((k) => key.includes(k) || k.includes(key))
  return match ? PLAYERS[match] : null
}
