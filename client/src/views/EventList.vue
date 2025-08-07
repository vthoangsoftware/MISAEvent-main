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
let lastEvaluatedKey = null
const fetchEvents = async () => {
  var res = await getPagedEvents(50, lastEvaluatedKey, searchText.value)
  if (res && res.items && res.items.length > 0) {
    events.value = [...events.value, ...res.items]
    lastEvaluatedKey = res.lastEvaluatedKey
  }
}

const redrectEmis = () => {
  window.open('https://emis.misa.vn/emis-kindergarten/', '_blank')
}

const searchEvent = async () => {
  lastEvaluatedKey = null
  events.value = []
  await fetchEvents()
}

const router = useRouter()

const handleClickEvent = event => {
  router.push({ name: 'eventView', params: { eventId: event.EventId } })
}

const handleScroll = () => {
  // Lấy vị trí cuộn hiện tại
  let scrollPosition = window.innerHeight + window.scrollY

  // Lấy chiều cao tổng của tài liệu
  let documentHeight = document.body.offsetHeight

  // Kiểm tra nếu đã cuộn đến cuối trang
  if (lastEvaluatedKey && scrollPosition >= documentHeight) {
    fetchEvents()
  }
}

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
</style>
