import { createApp } from 'vue'
import App from './App.vue'
const app = createApp(App)
localStorage.setItem('vueuse-color-scheme', 'light')
document.documentElement.classList.remove('dark')
app.mount('#app')
