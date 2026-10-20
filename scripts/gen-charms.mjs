/**
 * Generates consistent, hand-drawn vector charm artwork for the demo catalogue.
 * Outputs two files per charm:
 *   public/charms/<slug>.svg       — card image on a soft blush background
 *   public/charms/<slug>-art.svg   — transparent artwork used on the necklace canvas
 *
 * These are original illustrations for demo purposes, not photographs of a real inventory.
 */
import fs from 'node:fs'
import path from 'node:path'

const OUT = path.resolve('public/charms')
fs.mkdirSync(OUT, { recursive: true })

const DEFS = `
<defs>
  <radialGradient id="bg" cx="38%" cy="30%" r="85%">
    <stop offset="0" stop-color="#FFFAF4"/><stop offset=".62" stop-color="#FBF0E8"/><stop offset="1" stop-color="#F5E2D8"/>
  </radialGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#F9EDC3"/><stop offset=".28" stop-color="#E3C173"/>
    <stop offset=".55" stop-color="#B9862F"/><stop offset=".76" stop-color="#EFD79A"/><stop offset="1" stop-color="#C89A44"/>
  </linearGradient>
  <linearGradient id="goldRim" x1="0" y1="1" x2="1" y2="0">
    <stop offset="0" stop-color="#A97424"/><stop offset=".5" stop-color="#EBD190"/><stop offset="1" stop-color="#B9862F"/>
  </linearGradient>
  <linearGradient id="roseGold" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#F7D2C8"/><stop offset=".45" stop-color="#D9907F"/><stop offset="1" stop-color="#A9564A"/>
  </linearGradient>
  <radialGradient id="red" cx="35%" cy="28%" r="90%">
    <stop offset="0" stop-color="#EF7E8A"/><stop offset=".5" stop-color="#C93B4E"/><stop offset="1" stop-color="#8D1528"/>
  </radialGradient>
  <radialGradient id="pink" cx="35%" cy="28%" r="90%">
    <stop offset="0" stop-color="#FFEAF3"/><stop offset=".48" stop-color="#F0BBD2"/><stop offset="1" stop-color="#D183A6"/>
  </radialGradient>
  <radialGradient id="pearl" cx="34%" cy="28%" r="88%">
    <stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#FBF3EA"/><stop offset=".85" stop-color="#EAD8D0"/><stop offset="1" stop-color="#D8BDB5"/>
  </radialGradient>
  <linearGradient id="crystal" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#FFFFFF"/><stop offset=".35" stop-color="#FDF0F5"/><stop offset=".7" stop-color="#EBC6D6"/><stop offset="1" stop-color="#D7A7BC"/>
  </linearGradient>
  <linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#A9BE8E"/><stop offset=".6" stop-color="#6F8A5B"/><stop offset="1" stop-color="#4C6340"/>
  </linearGradient>
  <linearGradient id="navy" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#3C4A72"/><stop offset=".6" stop-color="#26314F"/><stop offset="1" stop-color="#1A2238"/>
  </linearGradient>
  <linearGradient id="blue" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#8EC4E8"/><stop offset=".6" stop-color="#3E79AC"/><stop offset="1" stop-color="#28527A"/>
  </linearGradient>
  <linearGradient id="mint" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#BCE3C6"/><stop offset=".6" stop-color="#7DB98A"/><stop offset="1" stop-color="#548A63"/>
  </linearGradient>
  <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
    <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#7A3B2E" flood-opacity="0.2"/>
  </filter>
  <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="10" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>`

const RING = `<circle cx="160" cy="52" r="13" fill="none" stroke="url(#gold)" stroke-width="6" filter="url(#soft)"/>
<circle cx="160" cy="66" r="4.5" fill="url(#gold)"/>`

const wrap = (art, withBg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" role="img">
${DEFS}
${withBg ? '<rect width="320" height="320" fill="url(#bg)"/><circle cx="160" cy="168" r="108" fill="#FFFDF8" opacity=".55"/>' : ''}
${RING}
<g filter="url(#soft)">${art}</g>
</svg>
`

/* ------------------------- design snippets ------------------------- */

const cherryDuo = `
<path d="M150 156 C154 128 168 118 178 112" fill="none" stroke="url(#gold)" stroke-width="6" stroke-linecap="round"/>
<path d="M186 178 C188 148 180 128 178 112" fill="none" stroke="url(#gold)" stroke-width="6" stroke-linecap="round"/>
<path d="M178 112 C196 102 214 108 220 122 C206 130 188 126 178 112Z" fill="url(#leaf)"/>
<path d="M183 115 C194 112 203 114 210 119" fill="none" stroke="#DCEBC9" stroke-width="2" stroke-linecap="round" opacity=".8"/>
<circle cx="140" cy="200" r="38" fill="url(#red)"/>
<circle cx="160" cy="222" r="30" fill="url(#red)"/>
<ellipse cx="128" cy="185" rx="10" ry="7" fill="#fff" opacity=".5" transform="rotate(-28 128 185)"/>
<ellipse cx="152" cy="210" rx="7" ry="5" fill="#fff" opacity=".4"/>
<circle cx="140" cy="200" r="38" fill="none" stroke="#7C1222" stroke-width="1.5" opacity=".25"/>
`

const designs = {
  'cherry-charm-pendant-14k': { art: cherryDuo },

  'cherry-crystal-charm': {
    art: `
<path d="M150 158 C154 130 168 120 178 114" fill="none" stroke="url(#gold)" stroke-width="6" stroke-linecap="round"/>
<path d="M186 178 C188 150 180 130 178 114" fill="none" stroke="url(#gold)" stroke-width="6" stroke-linecap="round"/>
<path d="M178 114 C196 104 214 110 220 124 C206 132 188 128 178 114Z" fill="url(#leaf)"/>
<circle cx="141" cy="202" r="36" fill="url(#crystal)" stroke="#FFFFFF" stroke-width="2"/>
<circle cx="161" cy="223" r="29" fill="url(#crystal)" stroke="#FFFFFF" stroke-width="2"/>
<path d="M122 190 L157 216 M133 178 L168 204 M128 212 L158 232" stroke="#FFFFFF" stroke-width="2" opacity=".8"/>
<ellipse cx="130" cy="188" rx="9" ry="6" fill="#fff" opacity=".85" transform="rotate(-30 130 188)"/>
<ellipse cx="151" cy="212" rx="6" ry="4" fill="#fff" opacity=".8"/>
<circle cx="141" cy="202" r="36" fill="none" stroke="#C89AB0" stroke-width="1.5"/>
`,
  },

  'cherry-oval-charm-pendant': {
    art: `
<ellipse cx="160" cy="190" rx="74" ry="88" fill="url(#gold)"/>
<ellipse cx="160" cy="190" rx="63" ry="77" fill="#FFF8EC"/>
<ellipse cx="160" cy="190" rx="57" ry="71" fill="none" stroke="url(#goldRim)" stroke-width="2"/>
<g transform="translate(160 196) scale(0.72)">
  <path d="M-10 -34 C-6 -62 8 -72 18 -78" fill="none" stroke="url(#gold)" stroke-width="7" stroke-linecap="round"/>
  <path d="M26 -12 C28 -42 20 -62 18 -78" fill="none" stroke="url(#gold)" stroke-width="7" stroke-linecap="round"/>
  <path d="M18 -78 C36 -88 54 -82 60 -68 C46 -60 28 -64 18 -78Z" fill="#6F8A5B"/>
  <circle cx="-20" cy="10" r="38" fill="#B3263C"/>
  <circle cx="0" cy="32" r="30" fill="#C93B4E"/>
  <ellipse cx="-32" cy="-5" rx="10" ry="7" fill="#fff" opacity=".45" transform="rotate(-28 -32 -5)"/>
</g>
<circle cx="160" cy="112" r="5" fill="url(#gold)"/>
`,
  },

  'cherry-blossom-charm': {
    art: `
${[0, 72, 144, 216, 288].map(a => `<ellipse cx="160" cy="146" rx="26" ry="40" fill="url(#pink)" stroke="#E2A7C1" stroke-width="1.5" transform="rotate(${a} 160 190)"/>`).join('')}
<circle cx="160" cy="190" r="22" fill="url(#gold)"/>
<circle cx="154" cy="184" r="2.5" fill="#8A5A16"/><circle cx="166" cy="184" r="2.5" fill="#8A5A16"/>
<circle cx="160" cy="196" r="2.5" fill="#8A5A16"/><circle cx="152" cy="194" r="2" fill="#8A5A16"/><circle cx="169" cy="194" r="2" fill="#8A5A16"/>
<circle cx="160" cy="190" r="22" fill="none" stroke="#C89A44" stroke-width="1.5" opacity=".7"/>
<circle cx="160" cy="104" r="5" fill="url(#gold)"/>
`,
  },

  'crescent-moon-charm': {
    art: `
<path d="M196 96 C140 104 104 150 112 202 C118 244 154 274 198 274 C172 250 158 216 162 182 C166 146 186 118 214 102 C208 99 202 97 196 96Z" fill="url(#gold)"/>
<path d="M128 176 C136 210 158 238 188 254" fill="none" stroke="#FFF6DC" stroke-width="3" opacity=".55" stroke-linecap="round"/>
<path d="M232 132 l5 13 13 5 -13 5 -5 13 -5 -13 -13 -5 13 -5Z" fill="url(#gold)"/>
<path d="M96 104 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4Z" fill="url(#gold)"/>
<circle cx="240" cy="224" r="3.5" fill="url(#gold)"/>
<circle cx="86" cy="212" r="2.5" fill="url(#gold)"/>
`,
  },

  'compass-coin-charm': {
    art: `
<circle cx="160" cy="186" r="82" fill="url(#gold)"/>
<circle cx="160" cy="186" r="72" fill="url(#navy)"/>
<circle cx="160" cy="186" r="72" fill="none" stroke="#EFD79A" stroke-width="2" opacity=".8"/>
<circle cx="160" cy="186" r="64" fill="none" stroke="#EFD79A" stroke-width="1" opacity=".5"/>
${Array.from({ length: 12 }, (_, i) => {
  const a = (i * 30 * Math.PI) / 180
  const x1 = 160 + Math.cos(a) * 60, y1 = 186 + Math.sin(a) * 60
  const x2 = 160 + Math.cos(a) * 66, y2 = 186 + Math.sin(a) * 66
  return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#EFD79A" stroke-width="2"/>`
}).join('')}
<path d="M160 126 L176 170 L160 162 L144 170Z" fill="#EFD79A"/>
<path d="M160 246 L144 202 L160 210 L176 202Z" fill="#E9A6C5"/>
<path d="M100 186 L144 170 L136 186 L144 202Z" fill="#EFD79A" opacity=".85"/>
<path d="M220 186 L176 202 L184 186 L176 170Z" fill="#EFD79A" opacity=".85"/>
<circle cx="160" cy="186" r="9" fill="#FFFDF8"/>
<circle cx="160" cy="186" r="4" fill="url(#gold)"/>
`,
  },

  'north-star-charm': {
    art: `
<path d="M160 98 L178 168 L248 186 L178 204 L160 274 L142 204 L72 186 L142 168Z" fill="url(#gold)"/>
<path d="M160 120 L171 175 L226 186 L171 197 L160 252 L149 197 L94 186 L149 175Z" fill="#FFF8E8" opacity=".25"/>
<circle cx="160" cy="186" r="16" fill="url(#pearl)"/>
<circle cx="160" cy="186" r="16" fill="none" stroke="url(#gold)" stroke-width="3"/>
<circle cx="214" cy="122" r="4" fill="url(#gold)"/><circle cx="106" cy="250" r="3" fill="url(#gold)"/><circle cx="236" cy="238" r="2.5" fill="url(#gold)"/>
`,
  },

  'sunburst-medallion-charm': {
    art: `
${Array.from({ length: 20 }, (_, i) => {
  const a = (i * 18 * Math.PI) / 180
  const x1 = 160 + Math.cos(a) * 64, y1 = 186 + Math.sin(a) * 64
  const x2 = 160 + Math.cos(a) * 84, y2 = 186 + Math.sin(a) * 84
  return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="url(#gold)" stroke-width="5" stroke-linecap="round"/>`
}).join('')}
<circle cx="160" cy="186" r="62" fill="url(#gold)"/>
<circle cx="160" cy="186" r="52" fill="url(#roseGold)"/>
<circle cx="142" cy="176" r="4.5" fill="#5A2320"/>
<path d="M136 168 q6 -5 12 0" fill="none" stroke="#5A2320" stroke-width="2.5" stroke-linecap="round"/>
<path d="M166 168 q6 -5 12 0" fill="none" stroke="#5A2320" stroke-width="2.5" stroke-linecap="round"/>
<path d="M148 200 q12 10 24 0" fill="none" stroke="#5A2320" stroke-width="2.5" stroke-linecap="round"/>
<circle cx="128" cy="196" r="7" fill="#E9A6C5" opacity=".55"/><circle cx="192" cy="196" r="7" fill="#E9A6C5" opacity=".55"/>
`,
  },

  'starry-night-charm': {
    art: `
<path d="M160 102 L183 160 L246 166 L198 207 L213 268 L160 234 L107 268 L122 207 L74 166 L137 160Z" fill="url(#navy)" stroke="url(#gold)" stroke-width="6" stroke-linejoin="round"/>
<path d="M160 128 L172 166 L210 170 L179 195 L189 232 L160 212 L131 232 L141 195 L110 170 L148 166Z" fill="none" stroke="#EFD79A" stroke-width="1.5" opacity=".7"/>
<circle cx="160" cy="182" r="14" fill="url(#gold)"/>
<path d="M160 174 l2.5 5.5 6 .7 -4.5 4 1.2 6 -5.2 -3 -5.2 3 1.2 -6 -4.5 -4 6 -.7Z" fill="#26314F"/>
`,
  },

  'crystal-diamond-heart': {
    art: `
<path d="M160 268 C112 232 84 198 84 160 C84 130 106 110 132 110 C146 110 156 117 160 128 C164 117 174 110 188 110 C214 110 236 130 236 160 C236 198 208 232 160 268Z" fill="url(#crystal)" stroke="#FFFFFF" stroke-width="3"/>
<path d="M160 128 L118 166 L160 252 L202 166Z" fill="#FFFFFF" opacity=".35"/>
<path d="M160 128 L118 166 L202 166Z" fill="#FFFFFF" opacity=".55"/>
<path d="M118 166 L160 252 M202 166 L160 252 M160 128 L160 252" stroke="#FFFFFF" stroke-width="2" opacity=".9"/>
<path d="M132 128 C120 138 112 150 112 164 L150 164 L156 132Z" fill="#F6D3E0" opacity=".7"/>
<ellipse cx="132" cy="146" rx="12" ry="7" fill="#fff" opacity=".85" transform="rotate(-30 132 146)"/>
<path d="M160 268 C112 232 84 198 84 160 C84 130 106 110 132 110 C146 110 156 117 160 128 C164 117 174 110 188 110 C214 110 236 130 236 160 C236 198 208 232 160 268Z" fill="none" stroke="url(#gold)" stroke-width="3"/>
`,
  },

  'crystal-teardrop-pendant': {
    art: `
<path d="M160 104 C160 104 208 174 208 212 C208 240 186 262 160 262 C134 262 112 240 112 212 C112 174 160 104 160 104Z" fill="url(#crystal)" stroke="#FFFFFF" stroke-width="3"/>
<path d="M160 104 L160 262 M136 176 L184 176 M124 210 L196 210" stroke="#FFFFFF" stroke-width="1.8" opacity=".8"/>
<path d="M160 104 L136 176 L160 210 L184 176Z" fill="#FFFFFF" opacity=".35"/>
<path d="M136 176 L124 210 L160 262 L160 210Z" fill="#FFFFFF" opacity=".22"/>
<path d="M184 176 L196 210 L160 262 L160 210Z" fill="#D7A7BC" opacity=".3"/>
<path d="M148 128 C138 150 132 172 130 192" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".9"/>
<path d="M136 104 h48 l-8 -18 h-32Z" fill="url(#gold)"/>
<circle cx="160" cy="88" r="6" fill="url(#gold)"/>
`,
  },

  'crystal-butterfly-charm': {
    art: `
<path d="M156 178 C128 134 84 128 80 164 C76 196 108 212 148 206Z" fill="url(#crystal)" stroke="#FFFFFF" stroke-width="2.5"/>
<path d="M164 178 C192 134 236 128 240 164 C244 196 212 212 172 206Z" fill="url(#crystal)" stroke="#FFFFFF" stroke-width="2.5"/>
<path d="M152 200 C122 208 100 234 112 254 C124 272 152 254 160 224Z" fill="url(#crystal)" stroke="#FFFFFF" stroke-width="2.5"/>
<path d="M168 200 C198 208 220 234 208 254 C196 272 168 254 160 224Z" fill="url(#crystal)" stroke="#FFFFFF" stroke-width="2.5"/>
<path d="M118 158 l22 10 M202 158 l-22 10 M126 238 l18 -8 M194 238 l-18 -8" stroke="#FFFFFF" stroke-width="2" opacity=".9"/>
<ellipse cx="160" cy="196" rx="10" ry="32" fill="url(#gold)"/>
<circle cx="160" cy="160" r="11" fill="url(#pearl)"/>
<path d="M152 152 C142 136 128 128 116 126 M168 152 C178 136 192 128 204 126" fill="none" stroke="url(#gold)" stroke-width="3" stroke-linecap="round"/>
<circle cx="115" cy="126" r="3.5" fill="url(#gold)"/><circle cx="205" cy="126" r="3.5" fill="url(#gold)"/>
`,
  },

  'pearl-drop-charm': {
    art: `
<path d="M142 116 h36 c0 12 -6 20 -18 20 s-18 -8 -18 -20Z" fill="url(#gold)"/>
<circle cx="160" cy="112" r="7" fill="url(#gold)"/>
<path d="M150 136 h20 l4 14 h-28Z" fill="url(#gold)" opacity=".9"/>
<circle cx="160" cy="210" r="48" fill="url(#pearl)"/>
<ellipse cx="142" cy="190" rx="14" ry="9" fill="#fff" opacity=".9" transform="rotate(-28 142 190)"/>
<ellipse cx="178" cy="230" rx="12" ry="8" fill="#E9A6C5" opacity=".35"/>
<circle cx="160" cy="210" r="48" fill="none" stroke="#E7D3CB" stroke-width="1.5"/>
<path d="M154 100 l6 -9 6 9 -6 9Z" fill="url(#gold)"/>
`,
  },

  'heart-locket-charm': {
    art: `
<path d="M160 266 C110 228 82 194 82 158 C82 128 104 108 130 108 C146 108 156 116 160 128 C164 116 174 108 190 108 C216 108 238 128 238 158 C238 194 210 228 160 266Z" fill="url(#gold)"/>
<path d="M160 246 C120 214 98 186 98 158 C98 138 112 124 132 124 C146 124 156 132 160 144 C164 132 174 124 188 124 C208 124 222 138 222 158 C222 186 200 214 160 246Z" fill="#FFF7E6"/>
<path d="M160 162 C148 148 128 152 128 168 C128 182 144 194 160 204 C176 194 192 182 192 168 C192 152 172 148 160 162Z" fill="url(#roseGold)"/>
<path d="M136 144 c8 -6 18 -4 22 2" stroke="#C89A44" stroke-width="1.5" fill="none" opacity=".7"/>
<path d="M186 226 c-6 4 -12 4 -16 0" stroke="#C89A44" stroke-width="1.5" fill="none" opacity=".7"/>
`,
  },

  'rose-enamel-heart-charm': {
    art: `
<path d="M160 266 C110 228 82 194 82 158 C82 128 104 108 130 108 C146 108 156 116 160 128 C164 116 174 108 190 108 C216 108 238 128 238 158 C238 194 210 228 160 266Z" fill="url(#pink)" stroke="url(#gold)" stroke-width="6"/>
<path d="M124 140 c10 -10 26 -8 32 6" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round" opacity=".65"/>
<circle cx="192" cy="184" r="4" fill="#fff" opacity=".8"/><circle cx="174" cy="212" r="3" fill="#fff" opacity=".65"/>
`,
  },

  'key-to-my-heart-charm': {
    art: `
<path d="M160 96 C136 96 120 112 120 134 C120 152 130 164 146 172 L146 256 L162 272 L178 256 L178 244 L166 232 L178 220 L178 208 L160 208 L160 172 C176 164 186 150 186 132 C186 111 176 96 160 96Z" fill="url(#gold)"/>
<path d="M160 122 C148 122 140 130 140 140 C140 150 148 158 160 158 C172 158 180 150 180 140 C180 130 172 122 160 122Z" fill="#FFF8EC"/>
<path d="M160 134 C154 128 144 132 144 140 C144 148 152 154 160 160 C168 154 176 148 176 140 C176 132 166 128 160 134Z" fill="url(#roseGold)"/>
<circle cx="148" cy="140" r="4" fill="url(#gold)"/><circle cx="172" cy="140" r="4" fill="url(#gold)"/>
`,
  },

  'initial-s-charm': { art: initialArt('S') },
  'initial-m-charm': { art: initialArt('M') },
  'initial-a-charm': { art: initialArt('A') },
  'initial-r-charm': { art: initialArt('R') },

  'butterfly-kiss-charm': {
    art: `
<path d="M152 176 C126 130 82 124 78 160 C74 194 106 210 146 202Z" fill="url(#gold)"/>
<path d="M168 176 C194 130 238 124 242 160 C246 194 214 210 174 202Z" fill="url(#gold)"/>
<path d="M150 198 C122 208 102 234 116 252 C130 268 154 250 160 222Z" fill="url(#gold)"/>
<path d="M170 198 C198 208 218 234 204 252 C190 268 166 250 160 222Z" fill="url(#gold)"/>
<path d="M116 154 a14 12 0 1 0 24 8 M204 154 a14 12 0 1 1 -24 8 M126 230 a8 8 0 0 0 14 6 M194 230 a8 8 0 0 1 -14 6" fill="none" stroke="#FFF7E6" stroke-width="3"/>
<ellipse cx="160" cy="196" rx="9" ry="30" fill="url(#roseGold)"/>
<circle cx="160" cy="162" r="10" fill="url(#pearl)"/>
<path d="M152 154 C142 138 128 130 116 128 M168 154 C178 138 192 130 204 128" fill="none" stroke="url(#gold)" stroke-width="3" stroke-linecap="round"/>
<circle cx="115" cy="128" r="3" fill="url(#gold)"/><circle cx="205" cy="128" r="3" fill="url(#gold)"/>
`,
  },

  'pink-bow-charm': {
    art: `
<path d="M160 190 C136 156 92 148 84 172 C78 192 100 212 126 210 C142 209 154 202 160 190Z" fill="url(#pink)" stroke="url(#gold)" stroke-width="5"/>
<path d="M160 190 C184 156 228 148 236 172 C242 192 220 212 194 210 C178 209 166 202 160 190Z" fill="url(#pink)" stroke="url(#gold)" stroke-width="5"/>
<path d="M150 200 C138 226 128 244 118 258 L142 252 L150 270 L162 210Z" fill="url(#pink)" stroke="url(#gold)" stroke-width="4" stroke-linejoin="round"/>
<path d="M170 200 C182 226 192 244 202 258 L178 252 L170 270 L158 210Z" fill="url(#pink)" stroke="url(#gold)" stroke-width="4" stroke-linejoin="round"/>
<rect x="146" y="178" width="28" height="26" rx="9" fill="url(#gold)"/>
<path d="M156 184 c4 4 4 10 0 14 M164 184 c-4 4 -4 10 0 14" stroke="#8A5A16" stroke-width="1.5" fill="none" opacity=".6"/>
`,
  },

  'evil-eye-charm': {
    art: `
<circle cx="160" cy="188" r="78" fill="url(#gold)"/>
<circle cx="160" cy="188" r="66" fill="#F4F1EA"/>
<circle cx="160" cy="188" r="58" fill="url(#blue)"/>
<circle cx="160" cy="188" r="44" fill="#F7F3EC"/>
<circle cx="160" cy="188" r="32" fill="#9CC6E4"/>
<circle cx="160" cy="188" r="20" fill="url(#navy)"/>
<circle cx="160" cy="188" r="8" fill="#121826"/>
<circle cx="148" cy="174" r="7" fill="#fff" opacity=".9"/>
<path d="M118 148 a58 58 0 0 1 30 -23" stroke="#FFFFFF" stroke-width="3" fill="none" stroke-linecap="round" opacity=".35"/>
`,
  },

  'four-leaf-clover-charm': {
    art: `
<path d="M160 190 L160 258" stroke="url(#gold)" stroke-width="6" stroke-linecap="round"/>
<path d="M160 240 C146 246 136 258 132 270" stroke="url(#gold)" stroke-width="5" stroke-linecap="round" fill="none"/>
<g>
<path d="M158 186 C130 176 120 150 136 134 C151 119 172 130 178 154 C171 174 166 182 158 186Z" fill="url(#mint)" stroke="url(#gold)" stroke-width="4"/>
<path d="M162 186 C190 176 200 150 184 134 C169 119 148 130 142 154 C149 174 154 182 162 186Z" fill="url(#mint)" stroke="url(#gold)" stroke-width="4"/>
<path d="M158 192 C130 202 120 228 136 244 C151 259 172 248 178 224 C171 204 166 196 158 192Z" fill="url(#mint)" stroke="url(#gold)" stroke-width="4"/>
<path d="M162 192 C190 202 200 228 184 244 C169 259 148 248 142 224 C149 204 154 196 162 192Z" fill="url(#mint)" stroke="url(#gold)" stroke-width="4"/>
</g>
<circle cx="160" cy="190" r="9" fill="url(#gold)"/>
<circle cx="148" cy="146" r="4" fill="#EAF6EC" opacity=".8"/>
`,
  },

  'golden-seashell-charm': {
    art: `
<path d="M160 272 C104 252 76 208 88 158 C96 122 128 100 160 100 C192 100 224 122 232 158 C244 208 216 252 160 272Z" fill="url(#gold)"/>
<path d="M160 262 C126 240 108 204 112 164 C116 134 136 116 160 116 C184 116 204 134 208 164 C212 204 194 240 160 262Z" fill="#FFF6E0" opacity=".55"/>
${Array.from({ length: 7 }, (_, i) => {
  const a = -68 + i * 22.6
  const rad = (a * Math.PI) / 180
  const x = 160 + Math.sin(rad) * 64
  const y = 130 + Math.cos(rad) * 64
  return `<path d="M160 266 Q${x.toFixed(0)} ${(y + 20).toFixed(0)} ${(160 + Math.sin(rad) * 72).toFixed(0)} ${(128 + Math.cos(rad) * 72).toFixed(0)}" fill="none" stroke="#C89A44" stroke-width="2" opacity=".6"/>`
}).join('')}
<path d="M160 272 C104 252 76 208 88 158" fill="none" stroke="#FFF3D6" stroke-width="3" opacity=".6" stroke-linecap="round"/>
<circle cx="160" cy="252" r="10" fill="url(#pearl)"/>
`,
  },

  'daisy-flower-charm': {
    art: `
${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<g transform="rotate(${a} 160 190)"><ellipse cx="160" cy="146" rx="16" ry="38" fill="#FFFDF7" stroke="#EAD9C4" stroke-width="1.5"/><ellipse cx="154" cy="146" rx="3" ry="30" fill="#F6E7D8" opacity=".7"/></g>`).join('')}
<circle cx="160" cy="190" r="28" fill="url(#gold)"/>
<circle cx="160" cy="190" r="20" fill="none" stroke="#A97424" stroke-width="1.5" opacity=".5" stroke-dasharray="2 5"/>
<circle cx="160" cy="190" r="6" fill="#A97424" opacity=".5"/>
<circle cx="160" cy="100" r="5" fill="url(#gold)"/>
`,
  },

  'rose-bloom-charm': {
    art: `
<path d="M160 262 C112 238 88 202 96 162 C104 126 134 104 160 96 C186 104 216 126 224 162 C232 202 208 238 160 262Z" fill="url(#roseGold)"/>
<path d="M160 236 C128 220 112 196 118 168 C124 142 144 126 160 120 C176 126 196 142 202 168 C208 196 192 220 160 236Z" fill="url(#gold)"/>
<path d="M160 212 C140 200 132 184 136 166 C140 150 151 140 160 136 C169 140 180 150 184 166 C188 184 180 200 160 212Z" fill="#E9A6C5"/>
<path d="M160 190 C148 182 144 172 146 160 C148 152 154 146 160 144 C166 146 172 152 174 160 C176 172 172 182 160 190Z" fill="#FFF4F9"/>
<path d="M110 148 C96 138 82 138 74 146 C88 154 100 154 110 148Z" fill="url(#leaf)"/>
<path d="M210 148 C224 138 238 138 246 146 C232 154 220 154 210 148Z" fill="url(#leaf)"/>
<circle cx="160" cy="100" r="5" fill="url(#gold)"/>
`,
  },

  'infinity-charm': {
    art: `
<path d="M110 200 C82 200 72 178 82 160 C92 142 118 144 138 166 L160 190 L182 166 C202 144 228 142 238 160 C248 178 238 200 210 200 C192 200 176 188 160 174 C144 188 128 200 110 200Z" fill="none" stroke="url(#gold)" stroke-width="12" stroke-linecap="round"/>
<path d="M160 174 C176 160 192 148 210 148 C230 148 238 162 232 174" fill="none" stroke="#FFF6DC" stroke-width="3" stroke-linecap="round" opacity=".7"/>
<circle cx="160" cy="174" r="8" fill="url(#pearl)"/>
<circle cx="160" cy="96" r="5" fill="url(#gold)"/>
`,
  },
}

function initialArt(letter) {
  return `
<circle cx="160" cy="188" r="82" fill="url(#gold)"/>
<circle cx="160" cy="188" r="70" fill="#FFF8EC"/>
<circle cx="160" cy="188" r="70" fill="none" stroke="#E3C173" stroke-width="1.5"/>
<circle cx="160" cy="188" r="63" fill="none" stroke="#E3C173" stroke-width="1" stroke-dasharray="1.5 4" opacity=".8"/>
<text x="160" y="228" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="96" fill="url(#gold)" stroke="#A97424" stroke-width="1">${letter}</text>
<circle cx="160" cy="106" r="5" fill="url(#gold)"/>
`
}

let count = 0
for (const [slug, { art }] of Object.entries(designs)) {
  fs.writeFileSync(path.join(OUT, `${slug}.svg`), wrap(art, true))
  fs.writeFileSync(path.join(OUT, `${slug}-art.svg`), wrap(art, false))
  count++
}
console.log(`Generated ${count} charms ×2 variants in ${OUT}`)
