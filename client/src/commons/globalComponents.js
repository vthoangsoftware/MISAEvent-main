import MsButton from '@/components/button/MsButton.vue'
import MsInput from '@/components/input/MsInput.vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Toast from 'primevue/toast'
export function useComponents(app) {
  app.component(Button.name, Button),
    app.component(InputText.name, InputText),
    app.component(Select.name, Select),
    app.component(Toast.name, Toast)
}
