#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const webDir = path.resolve(__dirname, '..')

const REQUIRED_ROUTES = ['/', 'pos', 'produk', 'stok', 'transaksi', 'laporan', 'pengaturan', 'backup']
const REQUIRED_BRIDGE_SYMBOLS = ['save_file', 'close_window', 'x-filename']

let allPassed = true

function recordCheck(name, passed, detail) {
  if (passed) {
    console.log(`[PASS] ${name}: ${detail}`)
  } else {
    allPassed = false
    console.error(`[FAIL] ${name}: ${detail}`)
  }
}

// Check 1: Read web/src/offline-main.tsx and assert the 8 routes exist
try {
  const offlineMainPath = path.resolve(webDir, 'src/offline-main.tsx')
  const content = fs.readFileSync(offlineMainPath, 'utf8')
  const missingRoutes = []

  for (const route of REQUIRED_ROUTES) {
    if (route === '/') {
      const hasRoot = /path="\/"/.test(content) || /Route\s+index/.test(content)
      if (!hasRoot) missingRoutes.push('/')
    } else {
      const hasRoute = new RegExp(`path=["']${route}["']`).test(content)
      if (!hasRoute) missingRoutes.push(route)
    }
  }

  if (missingRoutes.length === 0) {
    recordCheck('Routes', true, `all 8 offline routes defined in src/offline-main.tsx (${REQUIRED_ROUTES.join(', ')})`)
  } else {
    recordCheck('Routes', false, `missing route(s) in src/offline-main.tsx: ${missingRoutes.join(', ')}`)
  }
} catch (err) {
  recordCheck('Routes', false, `unable to read src/offline-main.tsx: ${err.message}`)
}

// Check 2: Read web/dist-lite/offline-lite.html and assert it references ./assets/... JS + CSS
const distHtmlPath = path.resolve(webDir, 'dist-lite/offline-lite.html')
try {
  const html = fs.readFileSync(distHtmlPath, 'utf8')
  const hasRelativeJs = /src=["']\.\/assets\/[^"']+\.js["']/.test(html)
  const hasRelativeCss = /href=["']\.\/assets\/[^"']+\.css["']/.test(html)
  const hasAbsoluteAssets = /=["']\/assets\//.test(html)

  if (hasRelativeJs && hasRelativeCss && !hasAbsoluteAssets) {
    recordCheck('HTML Assets', true, 'dist-lite/offline-lite.html references ./assets/... JS and CSS (relative paths)')
  } else {
    const details = []
    if (!hasRelativeJs) details.push('missing relative ./assets/*.js reference')
    if (!hasRelativeCss) details.push('missing relative ./assets/*.css reference')
    if (hasAbsoluteAssets) details.push('detected forbidden absolute /assets/ reference')
    recordCheck('HTML Assets', false, details.join(', '))
  }
} catch (err) {
  recordCheck('HTML Assets', false, `unable to read dist-lite/offline-lite.html: ${err.message}`)
}

// Check 3: Find built JS asset(s) and assert they contain save_file, close_window, x-filename
const distAssetsDir = path.resolve(webDir, 'dist-lite/assets')
try {
  if (!fs.existsSync(distAssetsDir)) {
    recordCheck('Tauri Bridge', false, `dist-lite/assets directory does not exist at ${distAssetsDir}`)
  } else {
    const jsFiles = fs.readdirSync(distAssetsDir).filter((f) => f.endsWith('.js'))
    if (jsFiles.length === 0) {
      recordCheck('Tauri Bridge', false, 'no .js assets found in dist-lite/assets')
    } else {
      let combinedJs = ''
      for (const jsFile of jsFiles) {
        combinedJs += fs.readFileSync(path.resolve(distAssetsDir, jsFile), 'utf8') + '\n'
      }

      const missingSymbols = REQUIRED_BRIDGE_SYMBOLS.filter((sym) => !combinedJs.includes(sym))
      if (missingSymbols.length === 0) {
        recordCheck('Tauri Bridge', true, `built JS assets contain ${REQUIRED_BRIDGE_SYMBOLS.join(', ')}`)
      } else {
        recordCheck(
          'Tauri Bridge',
          false,
          `built JS assets missing required bridge symbol(s): ${missingSymbols.join(', ')} (tauri-bridge unmerged or not bundled)`,
        )
      }
    }
  }
} catch (err) {
  recordCheck('Tauri Bridge', false, `error scanning built JS assets: ${err.message}`)
}

// Check 4: Assert web/dist-lite does not contain openpos.apk (drop plugin)
const apkPath = path.resolve(webDir, 'dist-lite/openpos.apk')
try {
  const apkExists = fs.existsSync(apkPath)
  if (!apkExists) {
    recordCheck('APK Drop', true, 'dist-lite does not contain openpos.apk (drop plugin active)')
  } else {
    recordCheck('APK Drop', false, 'dist-lite contains openpos.apk (drop plugin failed)')
  }
} catch (err) {
  recordCheck('APK Drop', false, `error checking openpos.apk: ${err.message}`)
}

// Check 5: Assert Lite HTML title is OpenPOS Lite and source entry is lite-main.tsx
const sourceHtmlPath = path.resolve(webDir, 'offline-lite.html')
try {
  const sourceHtml = fs.readFileSync(sourceHtmlPath, 'utf8')
  const hasLiteTitle = /<title>OpenPOS Lite<\/title>/.test(sourceHtml)
  const hasLiteEntry = /src=["']\/src\/lite-main\.tsx["']|src=["']src\/lite-main\.tsx["']|src=["']\.\/src\/lite-main\.tsx["']/.test(
    sourceHtml,
  )

  let distTitleMatch = true
  if (fs.existsSync(distHtmlPath)) {
    const distHtml = fs.readFileSync(distHtmlPath, 'utf8')
    distTitleMatch = /<title>OpenPOS Lite<\/title>/.test(distHtml)
  }

  if (hasLiteTitle && hasLiteEntry && distTitleMatch) {
    recordCheck('Entry & Title', true, "offline-lite.html title is 'OpenPOS Lite' and source entry is 'lite-main.tsx'")
  } else {
    const details = []
    if (!hasLiteTitle) details.push("source title is not 'OpenPOS Lite'")
    if (!hasLiteEntry) details.push("source entry does not point to 'lite-main.tsx'")
    if (!distTitleMatch) details.push("dist title is not 'OpenPOS Lite'")
    recordCheck('Entry & Title', false, details.join(', '))
  }
} catch (err) {
  recordCheck('Entry & Title', false, `error checking offline-lite.html: ${err.message}`)
}

// Final summary
console.log('---')
if (allPassed) {
  console.log('PARITY: PASS')
  process.exit(0)
} else {
  console.log('PARITY: FAIL')
  process.exit(1)
}
