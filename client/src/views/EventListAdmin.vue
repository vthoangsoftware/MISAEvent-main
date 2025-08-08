<template>
  <Dialog
    v-if="!isAuth"
    v-model:visible="visibleLogin"
    modal
    header="Thông tin đăng nhập"
    :style="{ width: '25rem' }"
    :closable="false"
  >
    <div class="flex items-center gap-4 mb-4">
      <label for="username" class="font-semibold w-24">Tài khoản</label>
      <InputText
        v-model="username"
        id="username"
        class="flex-auto"
        autocomplete="off"
      />
    </div>
    <div class="flex items-center gap-4 mb-8">
      <label for="email" class="font-semibold w-24">Mật khẩu</label>
      <Password :feedback="false" v-model="password" toggleMask />
    </div>
    <div class="flex justify-end gap-2">
      <Button type="button" label="Đăng nhập" @click="handleLogin"></Button>
    </div>
  </Dialog>
  <div class="container-eventInfo-list">
    <div class="header">
      <div class="absolute top-2 right-2 p-6">
        <Button
          class="btn-delete"
          v-if="isAuth"
          type="button"
          label="Đăng xuất"
          severity="danger"
          @click="handleLogout"
        ></Button>
      </div>

      <div class="flex p-6">
        <FileUpload
          v-if="isShowAllOptions"
          mode="basic"
          chooseIcon="icon24 upload"
          accept="image/*"
          :maxFileSize="50000000"
          :multiple="true"
          chooseLabel="Tải ảnh thiết lập VIP"
          @select="onFileSelect"
        />
        <Button
          type="button"
          label="Thêm sự kiện"
          @click="handleAddEvent"
        ></Button>
      </div>
      <div class="title-search">Tìm kiếm ảnh sự kiện tại đây</div>
      <div class="flex flex-col gap-2 mt-4">
        <IconField class="input-search shadow-xl shadow-green-500/50">
          <InputText
            class="search-text shadow-xl shadow-green-500/50"
            v-model="searchText"
            variant="filled"
            @keyup.enter="searchEvent"
            placeholder="Tìm sự kiện"
          />
          <InputIcon @click="searchEvent" class="icon24 search" />
        </IconField>
      </div>
    </div>
    <div class="eventInfo-list">
      <div
        class="eventInfo-item z-10 rounded-xl"
        v-for="(eventInfo, index) in events"
        :key="eventInfo.EventId"
      >
        <EventCard :event="eventInfo" @click="handleClickEvent(eventInfo)" />
        <div class="btn-action flex">
          <Button
            class="btn-delete"
            icon="icon24 delete"
            severity="secondary"
            @click="handleDeleteEvent(index)"
          />

          <Button
            class="btn-edit ml-2"
            icon="icon24 edit"
            severity="secondary"
            @click="handleEditEvent(eventInfo)"
          />
        </div>
      </div>
      
      <!-- Loading indicator -->
      <div v-if="isLoading" class="loading-container">
        <div class="flex flex-col items-center gap-3 p-6">
          <div class="loading-spinner"></div>
          <span class="text-gray-600">Đang tải sự kiện...</span>
        </div>
      </div>
      
      
      <!-- No events found -->
      <div v-if="!isLoading && events.length === 0" class="no-events-message">
        <div class="flex flex-col items-center gap-3 p-6">
          <i class="pi pi-search text-gray-400 text-3xl"></i>
          <span class="text-gray-600">Không tìm thấy sự kiện nào</span>
          <span class="text-sm text-gray-400">Thử thay đổi từ khóa tìm kiếm</span>
        </div>
      </div>
      
      <!-- Error with retry option -->
      <div v-if="loadError && !isLoading" class="error-container">
        <div class="flex flex-col items-center gap-3 p-6">
          <i class="pi pi-exclamation-triangle text-red-500 text-2xl"></i>
          <span class="text-red-600">{{ loadError }}</span>
          <Button 
            label="Thử lại" 
            icon="pi pi-refresh" 
            severity="secondary" 
            size="small"
            @click="retryLoad"
          />
        </div>
      </div>
      
      <!-- <img class="logo-ava" src="@/assets/logos/logo_ava.svg" alt="" /> -->
    </div>
  </div>
  <ConfirmPopup></ConfirmPopup>
  <ScrollTop :behavior="'smooth'" />
  <Toast position="bottom-right" />
</template>

<script setup>
import { defineComponent, ref, onMounted, watch, onUnmounted } from 'vue'
import EventCard from '@/components/EventCard.vue'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import FileUpload from 'primevue/fileupload'
import {
  createEventCollection,
  getEventCollection,
  getPagedEvents,
  getPagedImagesInEventFolder,
  deleteEventCollection,
} from '@/apis/eventApi'
import { uploadFaceSetup } from '@/apis/imageApi'
import { useRouter } from 'vue-router'
import _ from 'lodash'
import ScrollTop from 'primevue/scrolltop'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import ConfirmPopup from 'primevue/confirmpopup'
import Toast from 'primevue/toast'
import Dialog from 'primevue/dialog'
import Password from 'primevue/password'
import Compressor from 'compressorjs'

const confirm = useConfirm()
const toast = useToast()
const isAuth = ref(false)
const visibleLogin = ref(true)

const events = ref([]) // Mảng chứa danh sách sự kiện
const searchText = ref('')
const isLoading = ref(false)
const hasMoreData = ref(true)
const loadError = ref(null)
let lastEvaluatedKey = null

const fetchEvents = async (isRetry = false) => {
  if (isLoading.value || (!hasMoreData.value && !isRetry)) return
  
  try {
    isLoading.value = true
    loadError.value = null
    
    const res = await getPagedEvents(10, lastEvaluatedKey, searchText.value, false)
    
    if (res.items && res.items.length > 0) {
      events.value = [...events.value, ...res.items]
      lastEvaluatedKey = res.lastEvaluatedKey
      
      // Kiểm tra xem còn dữ liệu không
      if (!res.lastEvaluatedKey || res.items.length < 10) {
        hasMoreData.value = false
      }
    } else {
      hasMoreData.value = false
    }
  } catch (error) {
    console.error('Error loading events:', error)
    loadError.value = error.message || 'Có lỗi xảy ra khi tải dữ liệu'
    
    toast.add({
      severity: 'error',
      summary: 'Lỗi tải dữ liệu',
      detail: loadError.value,
      life: 3000,
    })
  } finally {
    isLoading.value = false
  }
}

const searchEvent = async () => {
  lastEvaluatedKey = null
  events.value = []
  hasMoreData.value = true
  loadError.value = null
  await fetchEvents()
}

const retryLoad = async () => {
  await fetchEvents(true)
}

const router = useRouter()

const handleClickEvent = eventInfo => {
  router.push({ name: 'eventView', params: { eventId: eventInfo.EventId } })
}

const handleAddEvent = () => {
  router.push({ name: 'createEvent' })
}

function base64EncodeFileName(fileName) {
  // Encode Unicode string to Uint8Array
  const uint8Array = new TextEncoder().encode(fileName)
  // Convert Uint8Array to binary string
  const binaryString = String.fromCharCode(...uint8Array)
  // Convert binary string to base64 and replace URL-unsafe characters
  return btoa(binaryString)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

const selectedFiles = ref([])
const onFileSelect = async event => {
  const files = Array.from(event.files)

  // Tạo mảng promises cho mỗi file nén
  const compressedPromises = files.map(file => {
    const originalFileName = file.name
    const encodedFileName = base64EncodeFileName(originalFileName)
    return new Promise((resolve, reject) => {
      // Sử dụng Compressor.js để nén ảnh
      new Compressor(file, {
        quality: 0.8,
        convertSize: 5000000,
        convertTypes: ['image/png', 'image/gif', 'image/webp'],
        success: compressedResult => {
          // Chuyển compressedResult từ Blob thành File
          const compressedFile = new File(
            [compressedResult], // Dữ liệu blob
            encodedFileName, // Tên gốc của tệp ảnh
            { type: compressedResult.type } // Kiểu MIME của tệp
          )
          selectedFiles.value.push(compressedFile)
          resolve(compressedFile)
          // const reader = new FileReader()
          // reader.onload = e => {
          //   selectedFiles.value.push({
          //     name: compressedFile.name,
          //     file: compressedFile,
          //     preview: e.target.result,
          //   })
          //   resolve(compressedFile) // Đánh dấu file đã nén hoàn tất
          // }
          // reader.readAsDataURL(compressedFile)
        },
        error: err => {
          console.error(err.message)
          reject(err) // Đánh dấu file lỗi khi nén
        },
      })
    })
  })

  // Chờ tất cả các promises hoàn thành
  try {
    await Promise.all(compressedPromises)
    const listImage = selectedFiles.value
    const res = await uploadFaceSetup(listImage) // Gọi hàm upload khi tất cả ảnh đã nén xong
    toast.add({
      severity: 'info',
      summary: 'Thành công',
      detail: `Thiết lập ${res.Success.length} VIP thành công, ${res.ErrorExists.length} đã tồn tại. `,
      life: 3000,
    })
  } catch (error) {
    console.error('Có lỗi xảy ra khi nén ảnh:', error)
  }
}

const handleEditEvent = eventInfo => {
  router.push({ name: 'editEvent', params: { eventId: eventInfo.EventId } })
}

const handleDeleteEvent = index => {
  const eventInfo = events.value[index]
  confirm.require({
    target: eventInfo.currentTarget,
    message: 'Bạn có chắc muốn xoá sự kiện không?',
    icon: '',
    rejectProps: {
      label: 'Huỷ',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: 'Xoá',
      severity: 'danger',
    },
    accept: async () => {
      await deleteEventCollection(eventInfo.EventId, eventInfo.PinCode || '')
      events.value.splice(index, 1)
      toast.add({
        severity: 'info',
        summary: 'Thành công',
        detail: 'Xóa thành công',
        life: 3000,
      })
    },
  })
}

const showSaveError = message => {
  toast.add({
    severity: 'error',
    summary: 'Thất bại',
    detail: message || 'Có lỗi xãy ra vui lòng thử lại',
    life: 3000,
  })
}

const accounts = [
  {
    username: 'admin',
    password: 'Misa@123',
  },
  {
    username: 'admin_tct',
    password: '12345678@Abc',
  },
]
const username = ref('')
const password = ref('')
const isShowAllOptions = ref(false)
const resetAuth = () => {
  username.value = ''
  password.value = ''
  events.value = []
  isAuth.value = false
  visibleLogin.value = true
  isLoading.value = false
  hasMoreData.value = true
  loadError.value = null
  lastEvaluatedKey = null
}
const handleLogin = () => {
  accounts.forEach(user => {
    if (user.username === username.value && user.password === password.value) {
      isShowAllOptions.value = user.username === 'admin'
      localStorage.setItem('showAllOptions', isShowAllOptions.value)
      localStorage.setItem('username', username.value)
      localStorage.setItem('password', password.value)
      isAuth.value = true
      visibleLogin.value = false
      fetchEvents()
      return
    }
  })
  if (!isAuth.value) {
    showSaveError('Tài khoản hoặc mật khẩu không đúng')
  }
}

const handleLogout = () => {
  localStorage.removeItem('username')
  localStorage.removeItem('password')
  localStorage.removeItem('showAllOptions')
  resetAuth()
}

// Debounced scroll handler để tránh gọi quá nhiều
const handleScroll = _.debounce(() => {
  // Bỏ qua nếu đang loading hoặc không còn dữ liệu
  if (isLoading.value || !hasMoreData.value) return

  // Lấy vị trí cuộn hiện tại
  const scrollPosition = window.innerHeight + window.scrollY
  // Lấy chiều cao tổng của tài liệu
  const documentHeight = document.body.offsetHeight
  
  // Trigger sớm hơn 200px từ cuối trang để UX mượt mà hơn
  const threshold = 200
  
  // Kiểm tra nếu đã cuộn gần cuối trang và còn dữ liệu để load
  if (lastEvaluatedKey && scrollPosition >= documentHeight - threshold) {
    fetchEvents()
  }
}, 100) // Debounce 100ms

onMounted(() => {
  const savedUsername = localStorage.getItem('username')
  const savedPassword = localStorage.getItem('password')

  accounts.forEach(user => {
    if (user.username === savedUsername && user.password === savedPassword) {
      isShowAllOptions.value = savedUsername === 'admin'
      localStorage.setItem('showAllOptions', isShowAllOptions.value)
      isAuth.value = true
      visibleLogin.value = false
      fetchEvents()
    }
  })

  if (!isAuth.value) {
    visibleLogin.value = true
  }

  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style lang="scss" scoped>
.container-eventInfo-list {
  .header {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    background-image: url('@/assets/images/background.svg');
    background-repeat: no-repeat;
    background-size: cover;
    height: 494px;
    border-bottom-left-radius: 24px;
    border-bottom-right-radius: 24px;
    .title-search {
      font-size: 48px;
      font-weight: 700;
      color: #fff;
    }
    :deep(.p-inputtext) {
      border: 3px #01b58a solid;
      border-radius: 12px;
    }
    .input-search {
      border-radius: 12px;
    }
  }
}
.eventInfo-list {
  margin: 0 90px;
  transform: translateY(-100px);
  display: grid;
  gap: 20px; /* Khoảng cách giữa các card */
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  justify-content: center; /* Căn giữa các card nếu có không gian thừa */
  padding: 20px;
  position: relative;
  z-index: 10;
  .logo-ava {
    position: absolute;
    top: -204px;
    right: 0;
    transform: rotate(90);
  }

  .eventInfo-item {
    z-index: 200;

    position: relative;
    .btn-action {
      position: absolute;
      top: 12px;
      left: 12px;
    }
  }
}

.search-text {
  width: 500px;
}

:deep(.p-inputicon) {
  transform: translateY(-6px);
}

// Loading spinner animation
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #01b58a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// Status containers styling
.loading-container,
.no-events-message,
.error-container {
  grid-column: 1 / -1; // Span across all columns
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 120px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  margin: 20px 0;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.error-container {
  background: rgba(254, 242, 242, 0.9);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.no-events-message {
  background: rgba(249, 250, 251, 0.9);
  border: 1px solid rgba(156, 163, 175, 0.2);
}
</style>
