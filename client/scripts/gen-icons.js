// Generate PWA icons from the favicon SVG
// Run: node scripts/gen-icons.js
// Requires: npm install sharp (dev dependency)

import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svg = readFileSync(join(__dirname, '..', 'public', 'favicon.svg'))

const sizes = [192, 512]

for (const size of sizes) {
  await sharp(svg).resize(size, size).png().toFile(join(__dirname, '..', 'public', `icon-${size}.png`))
  console.log(`Generated icon-${size}.png`)
}

console.log('Done!')
