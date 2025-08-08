<!-- src/views/EventList.vue -->
<template>
  <div class="container-event-list">
    <div class="header">
      <div class="title-search mb:hidden">Tìm kiếm ảnh sự kiện tại đây</div>
      <div class="w-full px-4 hidden mb:block">
        <div
          class="title h-10 bg-white rounded-lg text-base font-semibold text-right p-2"
        >
          Ảnh sự kiện
        </div>
      </div>
      <div class="flex flex-col gap-2 mt-4 mb:w-full px-4">
        <IconField class="input-search shadow-xl shadow-green-500/50">
          <InputText
            ref="refSearchText"
            class="search-text shadow-xl shadow-green-500/50"
            v-model="searchText"
            @keyup.enter="searchEvent"
            placeholder="Tìm sự kiện theo tên, mô tả"
          />
          <InputIcon @click="searchEvent" class="icon24 search" />
        </IconField>
      </div>
    </div>
    <div class="event-list">
      <div class="z-10 rounded-xl" v-for="event in events" :key="event.id">
        <EventCard :event="event" @click="handleClickEvent(event)" />
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
          <button 
            class="retry-button"
            @click="retryLoad"
          >
            Thử lại
          </button>
        </div>
      </div>
      
      <!-- <img
        class="logo-ava mb:hidden"
        src="@/assets/logos/logo_ava.svg"
        alt=""
      /> -->
    </div>
  </div>

  <div class="footer flex">
    <div class="text-base font-bold pr-2">
      Một sản phẩm của
      <span @click="redrectEmis" class="link underline cursor-pointer"
        >MISA EMIS</span
      >
    </div>
    <div
      @click="redrectEmis"
      class="cursor-pointer rotate-180 icon24 back"
    ></div>
  </div>

  <ScrollTop :behavior="'smooth'" />
</template>

<script setup>
import {
  defineComponent,
  ref,
  onMounted,
  watch,
  onUnmounted,
  getCurrentInstance,
  nextTick,
} from 'vue'
import EventCard from '@/components/EventCard.vue'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import {
  createEventCollection,
  getEventCollection,
  getPagedEvents,
  getPagedImagesInEventFolder,
  deleteEventCollection,
} from '@/apis/eventApi'
import { useRouter } from 'vue-router'
import _ from 'lodash'
import ScrollTop from 'primevue/scrolltop'

const { proxy } = getCurrentInstance()

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
    
    const res = await getPagedEvents(10, lastEvaluatedKey, searchText.value)
    
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
  } finally {
    isLoading.value = false
  }
}

const redrectEmis = () => {
  window.open('https://emis.misa.vn/emis-kindergarten/', '_blank')
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

const handleClickEvent = event => {
  router.push({ name: 'eventView', params: { eventId: event.EventId } })
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
  fetchEvents()
  window.addEventListener('scroll', handleScroll)
  // nextTick(() => {
  //   document.querySelector('.search-text')?.focus()
  // })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style lang="scss" scoped>
.container-event-list {
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
    .title {
      background-image: url('@/assets/icons/logo.svg');
      background-repeat: no-repeat;
      background-size: 50px 18px;
      background-position: 16px;
    }
    .input-search {
      border-radius: 12px;
    }
  }
}
.event-list {
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
}

.search-text {
  width: 500px;
}

:deep(.p-inputicon) {
  transform: translateY(-6px);
}

$mobile-width: 639px;

@media all and (max-width: $mobile-width) {
  .search-text {
    width: 100% !important;
  }

  .container-event-list {
    .header {
      height: 298px !important;
      background-image: url('@/assets/images/backgrounb_mb.svg') !important;
    }
  }
}

.footer {
  position: fixed;
  justify-content: center;
  align-items: center;
  bottom: 0;
  width: 100%;
  height: 42px;
  background-color: #f1f3f9;
  z-index: 99;
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

.retry-button {
  padding: 8px 16px;
  background-color: #01b58a;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background-color: #019970;
  }

  &:active {
    background-color: #017a5a;
  }
}
</style>
