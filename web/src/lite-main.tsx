import { installTauriBridge } from './lib/tauri-bridge'

installTauriBridge()

window.addEventListener('contextmenu', (e) => {
  e.preventDefault()
})
// Dynamic import ensures the Tauri bridge is fully installed on window before offline-main evaluates and mounts React.
await import('./offline-main')
