import { createApp } from 'vue'
import './style.css'
import Main from './pages/Main.vue'
import router from './router/router'

createApp(Main).use(router).mount('#app')

