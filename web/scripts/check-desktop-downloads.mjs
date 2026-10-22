#!/usr/bin/env node
// Verifies the OpenPOS Desktop download assets on GitHub Releases.
// Only Tauri releases (tags `lite-v*` / `desktop-v*`) count; the Electron
// releases (`v1.x`, `v0.2.x`) ship a different installer lineup and are ignored.
// Run from `web/`: node scripts/check-desktop-downloads.mjs

const RELEASES_URL = 'https://api.github.com/repos/0xMinomus/OpenPOS/releases?per_page=100'
const TAURI_TAG = /^(lite|desktop)-v/i

const NEEDS = [
  { platform: 'windows', ext: '.exe', matches: (name) => name.endsWith('.exe') && name.includes('setup') },
  { platform: 'linux', ext: '.deb', matches: (name) => name.endsWith('.deb') },
  { platform: 'linux', ext: '.rpm', matches: (name) => name.endsWith('.rpm') },
  { platform: 'linux', ext: '.AppImage', matches: (name) => name.endsWith('.appimage') },
]

function fail(message) {
  console.error(`FAIL: ${message}`)
  process.exitCode = 1
}

const ATTEMPTS = 4
const RETRY_DELAY_MS = 1000

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchReleases() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'openpos-desktop-download-check',
  }
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    // The release list intermittently comes back empty from GitHub's cache
    // (two ETags in rotation). A unique query string forces a fresh read.
    const url = attempt === 1 ? RELEASES_URL : `${RELEASES_URL}&attempt=${attempt}-${Date.now()}`
    const releases = await fetchOnce(url, headers)
    if (!releases) return null
    if (releases.length > 0) return releases
    if (attempt < ATTEMPTS) await sleep(RETRY_DELAY_MS)
  }

  fail(`daftar release GitHub kosong setelah ${ATTEMPTS} percobaan`)
  return null
}

async function fetchOnce(url, headers) {
  let res
  try {
    res = await fetch(url, { headers })
  } catch (err) {
    fail(`tidak dapat menghubungi api.github.com: ${err.message}`)
    return null
  }

  if (!res.ok) {
    const remaining = res.headers.get('x-ratelimit-remaining')
    if (res.status === 403 && remaining === '0') {
      const reset = Number(res.headers.get('x-ratelimit-reset'))
      const when = Number.isFinite(reset) ? new Date(reset * 1000).toISOString() : 'tidak diketahui'
      fail(`rate limit GitHub tercapai (reset ${when}). Set GITHUB_TOKEN untuk kuota lebih tinggi.`)
    } else {
      fail(`GitHub API mengembalikan HTTP ${res.status} ${res.statusText}`)
    }
    return null
  }

  let data
  try {
    data = await res.json()
  } catch (err) {
    fail(`respons GitHub bukan JSON yang valid: ${err.message}`)
    return null
  }
  if (!Array.isArray(data)) {
    fail('respons GitHub bukan daftar release')
    return null
  }
  return data
}

async function main() {
  const releases = await fetchReleases()
  if (!releases) return

  // Draft releases never ship to users. GitHub returns releases newest first,
  // so the first matching asset per need is the newest one.
  const tauriReleases = releases.filter(
    (release) => !release.draft && TAURI_TAG.test(release.tag_name ?? ''),
  )

  if (tauriReleases.length === 0) {
    fail('tidak ada release Tauri (tag lite-v* / desktop-v*)')
    return
  }

  let missing = 0
  for (const need of NEEDS) {
    let asset = null
    for (const release of tauriReleases) {
      asset = (release.assets ?? []).find((candidate) => need.matches(candidate.name.toLowerCase()))
      if (asset) break
    }

    if (!asset) {
      fail(`${need.platform} ${need.ext} tidak ditemukan di release Tauri`)
      missing++
      continue
    }

    const sizeMb = (asset.size / 1024 / 1024).toFixed(1)
    console.log(`${need.platform.padEnd(8)} ${asset.name} ${sizeMb} MB ${asset.browser_download_url}`)
  }

  if (missing === 0) console.log('DOWNLOADS: PASS')
}

await main()
