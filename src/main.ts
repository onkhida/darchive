import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { Buffer } from 'buffer'

    // Polyfill Buffer for the browser
    ; (globalThis as any).Buffer = Buffer

createApp(App).use(router).mount('#app')
