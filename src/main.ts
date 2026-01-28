import { createApp } from 'vue'
// import './style.css'
import './assets/main.css'
import App from './App.vue'
import router from './router'
import 'vue-sonner/style.css'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { pt } from 'vuetify/locale' 

// Cria o Vuetify com locale pt-BR
const vuetify = createVuetify({
  components,
  directives,
  locale: {
    locale: 'pt',        // define o idioma padrão
    messages: { pt },    // importa as traduções
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1976D2',
          secondary: '#424242',
          accent: '#82B1FF',
        },
      },
    },
  },
})

const app = createApp(App)

app.use(Toast, {
  position: 'top-right',
  timeout: 3000,
  closeOnClick: true,
  pauseOnHover: true,
  containerClassName: 'toast-container'
})

// Usa o router e o Vuetify
app.use(router)
app.use(vuetify)

app.mount('#app')
