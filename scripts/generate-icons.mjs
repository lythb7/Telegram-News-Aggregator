/**
 * Generates icon-192.png and icon-512.png from public/icons/icon.svg.
 *
 * Run once after cloning, or whenever you change icon.svg:
 *   npm run icons
 *
 * Requires: npm install --save-dev sharp
 */

import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root      = join(__dirname, '..')
const iconsDir  = join(root, 'public', 'icons')

mkdirSync(iconsDir, { recursive: true })

const svg = readFileSync(join(iconsDir, 'icon.svg'))

const sizes = [192, 512]

for (const size of sizes) {
  const outPath = join(iconsDir, `icon-${size}.png`)
  await sharp(svg).resize(size, size).png().toFile(outPath)
  console.log(`✓  icon-${size}.png`)
}

console.log('\nDone. Icons written to public/icons/')
