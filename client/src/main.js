import './assets/main.css'
import '@/assets/scss/icon.scss'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import { definePreset } from '@primevue/themes'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
// Gọi hàm sử dụng các component toàn cục
import { useComponents } from '@/commons/globalComponents.js'
const app = createApp(App)

useComponents(app)

const MyPreset = definePreset(Aura, {
  primitive: {
    green: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#01B58A',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
  },
  semantic: {
    primary: {
      50: '{green.50}',
      100: '{green.100}',
      200: '{green.200}',
      300: '{green.300}',
      400: '{green.400}',
      500: '{green.500}',
      600: '{green.600}',
      700: '{green.700}',
      800: '{green.800}',
      900: '{green.900}',
      950: '{green.950}',
    },
  },
})
app.use(ToastService)
app.use(ConfirmationService)

app.use(PrimeVue, {
  theme: {
    preset: MyPreset,
    options: {
      darkModeSelector: false || 'none',
    },
  },
  pt: {
    button: {
      label: 'font-normal',
    },
  },
  options: {
    cssLayer: false,
  },
})
app.use(router)

app.mount('#app')
