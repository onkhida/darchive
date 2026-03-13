import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { Buffer } from 'buffer'

    // Polyfill Buffer for the browser
    ; (globalThis as any).Buffer = Buffer

const app = createApp(App)
app.use(router)
app.mount('#app')

// Invoke KaTeX auto-render after the app is mounted and on each route change so
// any injected math (from v-html) is rendered. The window.rendermath function
// is provided by KaTeX's auto-render script loaded from CDN.
const runKatex = () => {
    // @ts-ignore
    if (window && (window as any).renderMathInElement) {
        // Render math in the entire document body; configure delimiters to match our usage
        // @ts-ignore
        (window as any).renderMathInElement(document.body, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false }
            ],
            throwOnError: false
        })
    }
}

// Run once on mount (slightly delayed to allow initial content injection)
setTimeout(runKatex, 300)

// Re-run on each route change (to render injected markdown content)
if (router && router.afterEach) {
    router.afterEach(() => {
        setTimeout(runKatex, 120)
    })
}
