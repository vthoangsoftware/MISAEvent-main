<template>
  <div
    class="event-name-mobile text-xl px-4 font-semibold mb-3 pb-2 hidden mb:flex pt-6"
  >
    <div @click="back" class="icon24 back mr-2"></div>
    <div>
      {{ event.EventName }}
    </div>
  </div>
  <div class="event-view px-4">
    <div
      class="image-container mb-6"
      :style="{
        backgroundImage: `url(${event.EventThumbnail})`,
      }"
    >
      <div class="dialog-pin-code" v-if="!passPinCode">
        <div class="wrap p-6 mb:p-4">
          <InputText
            v-model="pinCode"
            class="pin-code-text w-full"
            type="text"
            size="large"
            placeholder="Nhập mã PIN sự kiện"
            :style="{
              height: checkIfMobile ? '36px' : '64px',
            }"
            :disabled="isLoading"
            @keyup.enter="viewImage"
          />

          <Button
            :style="{
              height: checkIfMobile ? '36px' : '64px',
            }"
            :label="checkIfMobile ? 'Xem ảnh' : 'Xem ảnh sự kiện'"
            class="w-full"
            icon="icon32 eye"
            :disabled="isLoading"
            :loading="isDownload"
            @click="viewImage"
          />
        </div>
      </div>
    </div>

    <div class="container mx-auto pb-6">
      <div class="event-name font-bold mb-2 mb:hidden">
        {{ event.EventName }}
      </div>
      <div class="flex mb-4">
        <div class="event-date flex items-center mr-4">
          <div class="icon24 date-picker-gray mr-2"></div>
          {{ event.EventTime }}
        </div>

        <div
          v-if="passPinCode && totalImage > 0"
          class="event-date flex items-center"
        >
          <div class="icon24 photo mr-2"></div>
          {{ totalImage }}
        </div>
      </div>
      <div class="event-des pt-4">
        {{ event.EventDescription }}
      </div>

      <div v-if="passPinCode" class="images mt-6">
        <div class="mb-4 flex items-center flex-wrap">
          <Select
            v-model="selectedMode"
            :options="isShowAllOptions ? modes : filteredModes"
            optionLabel="name"
            optionValue="code"
            dropdownIcon="icon24 check-round"
            class="w-80 mr-4 mb:w-full mb:mr-0"
            style="height: 36px"
            @change="onChangeModeSearch"
          />
          <!-- Lọc ảnh theo tên-->
          <Select
            ref="refFilterName"
            v-if="selectedMode == MODE_SEARCH.NAME"
            v-model="faceSearch"
            :options="faceSetups"
            :autofocus="true"
            :auto-filter-focus="true"
            :auto-option-focus="true"
            :focused="true"
            optionLabel="Name"
            optionValue="Name"
            dropdownIcon="icon24 check-round"
            class="w-80 mr-4 mb:w-full mb:mr-0 mb:mt-2"
            filter
            style="height: 36px"
            @change="onChangeSearchName"
          />

          <!-- Tìm theo ảnh chân dung -->

          <div
            v-if="fileSelected"
            class="file-name w-80 mr-6 mb:w-full mb:mr-0 mb:mt-2"
          >
            {{ fileSelected?.name }}
          </div>

          <Button
            v-if="
              ((selectedMode == MODE_SEARCH.NAME &&
                faceSearch &&
                listUrlImage?.length &&
                !checkIfMobile) ||
                (selectedMode == MODE_SEARCH.PORTRAIT && fileSelected)) &&
              !checkIfMobile
            "
            :label="`Tải về máy (${listUrlImage?.length || 0} ảnh)`"
            icon="icon24 download"
            class="mr-2 mb:mt-2 mb:mr-0"
            :class="[
              selectedMode == MODE_SEARCH.NAME ? 'mb:w-full' : 'mb:w-1/2',
            ]"
            style="height: 36px"
            :disabled="!listUrlImage?.length || isDownload || isLoading"
            :loading="isDownload"
            @click="downloadImage()"
          />
          <div
            class="mb:mt-2"
            :class="[!fileSelected ? 'mb:w-full' : 'mb:w-1/2 mb:pl-1']"
            v-if="selectedMode == MODE_SEARCH.PORTRAIT"
          >
            <FileUpload
              ref="fileupload"
              mode="basic"
              accept="image/*"
              :maxFileSize="20000000"
              @select="onSelectImage"
              class="fileupload mb:w-full"
              :class="[!fileSelected ? 'w-80' : 'has-file w-44']"
              style="height: 36px"
              :chooseLabel="
                !fileSelected ? 'Tải ảnh chân dung' : 'Chọn ảnh khác'
              "
              :chooseIcon="
                !fileSelected
                  ? 'icon24 upload-image-v2'
                  : 'icon24 upload-image-v3'
              "
            >
            </FileUpload>
          </div>
        </div>

        <div
          class="grid 2xl:grid-cols-5 xl:grid-cols-4 sm:grid-cols-2 mb:grid-cols-2 md:grid-cols-3 gap-4"
        >
          <ImageCard
            v-for="(url, index) in listUrlThumbnailImage"
            :key="url"
            :url="url"
            :index="index"
            :isLoading="isLoading"
            :listUrlImage="listUrlImage"
            @downloadImage="downloadImage"
            @loadOriginalImage="loadOriginalImage"
          />

          <ImageCard
            v-for="(url, index) in 3"
            v-if="isLoading"
            :isLoading="true"
            :listUrlImage="listUrlImage"
          />
        </div>
      </div>
    </div>
  </div>

  <div
    class="preview-wrap justify-between mb:justify-center"
    v-if="indexCurrentPreview >= 0"
    @click.self="closePreview"
  >
    <div
      v-if="selectedMode == MODE_SEARCH.NAME && faceSearch"
      class="items-center header-mobile hidden mb:flex"
    >
      <div class="icon24 tag-name"></div>
      <div class="tag-name-text bg-white px-2 h-6 ml-2">{{ faceSearch }}</div>
    </div>
    <div class="preview-header flex mt-6 mb:hidden">
      <div
        v-if="selectedMode == MODE_SEARCH.NAME && faceSearch"
        class="flex items-center"
      >
        <div class="text-white font-bold text-base mr-4">
          {{ `Ảnh ${indexCurrentPreview + 1}/${listUrlImage.length}` }}
        </div>
        <div class="icon24 tag-name"></div>
        <div class="tag-name-text px-2 h-6 ml-2">{{ faceSearch }}</div>
      </div>
      <div></div>

      <div>
        <Button
          label="Tải về máy"
          icon="icon24 download"
          style="height: 36px"
          @click="downloadImage(getUrlPreview(url, index))"
        />
      </div>
    </div>
    <div class="preview-content">
      <div
        class="preview-container"
        :style="transformStyle"
        :class="{ 'is-dragging': isDragging, 'is-zooming': isZooming }"
      >
        <img
          v-for="(imageUrl, idx) in listUrlImage"
          :key="idx"
          class="image-preview"
          :src="
            indexCurrentPreview == idx && isOriginalImageLoaded
              ? imageUrl
              : listUrlThumbnailImage[idx]
          "
          :data-src="imageUrl"
          alt="preview"
          @touchstart="handleStart"
          @touchmove="handleMove"
          @touchend="handleEnd"
          @dragstart="handleStart"
          @drag="handleMove"
          @dragover="handleDragOver"
          @dragend="handleEnd"
        />
      </div>

      <div class="next-btn cursor-pointer" @click="nextPreviewImage(1)">
        <div class="icon icon40 next"></div>
      </div>
      <div class="back-btn cursor-pointer" @click="nextPreviewImage(-1)">
        <div class="icon icon40 back"></div>
      </div>
    </div>
    <div
      class="close-btn icon40 close cursor-pointer"
      @click="closePreview"
    ></div>
    <div class="preview-footer flex mb-6 mb:hidden">
      <div
        class="preview-item mr-2 cursor-pointer"
        v-for="item in getImagesPreview(index)"
        :style="{
          backgroundImage: `url(${item.value})`,
        }"
        :class="{
          selected: item.index == indexCurrentPreview,
        }"
        @click="indexCurrentPreview = item.index"
      ></div>
    </div>

    <div
      class="info-iphone flex items-center"
      v-if="isIphone()"
      @click="showGuide = true"
    >
      <div class="icon24 info-square mr-1"></div>
      <div class="">Ấn giữ vào ảnh để tải về</div>
    </div>
    <div
      class="guide-iphone-container"
      @click.self="showGuide = false"
      v-if="showGuide"
    >
      <div class="guide-iphone text-base">
        <div class="font-semibold text-center mb-3">
          Hướng dẫn tải ảnh trên iPhone
        </div>
        <div class="text-center">
          Ấn giữ và chọn <b>Lưu vào Ảnh</b> để tải về kho ảnh trên điện thoại
        </div>
        <div class="flex justify-center">
          <img src="@/assets/images/image-guide.png" alt="Hướng dẫn iphone" />
        </div>
        <div class="btn-close-guide" @click="showGuide = false">Đã hiểu</div>
      </div>
    </div>

    <div class="preview-footer-mobile hidden mb:flex">
      <div class="w-24"></div>
      <div>
        {{ `${indexCurrentPreview + 1}/${listUrlImage.length}` }}
      </div>
      <div
        class="flex items-center"
        @click="downloadImage(getUrlPreview(url, index))"
        v-if="!isIphone()"
      >
        <div class="icon24 download-mobile mr-2"></div>
        <div>Tải xuống</div>
      </div>
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
  <ScrollTop v-if="indexCurrentPreview < 0" :behavior="'smooth'" />
  <Toast />
</template>

<script setup>
import {
  ref,
  onMounted,
  onUnmounted,
  defineEmits,
  reactive,
  computed,
  nextTick,
  watch,
  getCurrentInstance,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getEventCollection,
  getPagedImagesInEventFolder,
} from '@/apis/eventApi'
import ScrollTop from 'primevue/scrolltop'
import {
  getFaceSetup,
  searchImageByNameFaceSetup,
  searchByImage,
} from '@/apis/imageApi.js'
import FileUpload from 'primevue/fileupload'
import JSZip from 'jszip'
import dayjs from 'dayjs'
import ImageCard from '@/components/ImageCard.vue'
import { useToast } from 'primevue/usetoast'
import Compressor from 'compressorjs'
import { saveAs } from 'file-saver'

const { proxy } = getCurrentInstance()

const toast = useToast()

const router = useRouter()
const eventInfo = reactive({})
const emit = defineEmits()
const event = reactive({})
const eventId = ref('')
const route = useRoute()
const pinCode = ref('')
const passPinCode = ref(true)
const listUrlImage = ref([])
const listUrlThumbnailImage = ref([])
const limit = 20
const totalImage = ref(0)
let nextContinuationToken = null
const isLoading = ref(false)
const clientWidth = ref(document.documentElement.clientWidth)
const isDownload = ref(false)
const isCallingApi = ref(false)
const isOriginalImageLoaded = ref(false)
const viewImage = async () => {
  isLoading.value = true
  if (pinCode.value) {
    router.replace({
      name: 'eventView',
      params: { eventId: eventId.value },
      query: { pinCode: pinCode.value },
    })
  }
  if (selectedMode.value == MODE_SEARCH.NAME) {
    passPinCode.value = true
    await onChangeSearchName({
      value: faceSearch.value,
    })
  } else {
    await loadImage()
    removeFileNameEmpty()
  }
  isLoading.value = false
}

let isFirstLoadImage = true

const loadImage = async () => {
  if (isCallingApi.value) return

  try {
    isCallingApi.value = true

    const data = await getPagedImagesInEventFolder(
      eventId.value,
      pinCode.value,
      limit,
      nextContinuationToken,
      isFirstLoadImage
    )
    if (
      data.nextContinuationToken &&
      nextContinuationToken == data.nextContinuationToken
    ) {
      return
    }

    if (isFirstLoadImage && data.totalCount) {
      totalImage.value = data.totalCount
    }
    isFirstLoadImage = false

    const resUrlImages = data.images.map(item => item.originalUrl)
    const resUrlThumbnails = data.images.map(item => item.thumbnailUrl)
    if (!nextContinuationToken || !listUrlImage.value) {
      listUrlImage.value = resUrlImages
      listUrlThumbnailImage.value = resUrlThumbnails
    } else {
      listUrlImage.value.push(...resUrlImages)
      listUrlThumbnailImage.value.push(...resUrlThumbnails)
    }
    nextContinuationToken = data.nextContinuationToken
    passPinCode.value = true
  } catch (error) {
    switch (error.message) {
      case 'Invalid PIN code.':
        toast.add({
          severity: 'error',
          summary: 'Mã pin không hợp lệ!',
          life: 3000,
        })
        break

      case 'PIN code is required in headers.':
        toast.add({
          severity: 'error',
          summary: 'Mã pin không được để trống!',
          life: 3000,
        })
        break
    }

    console.log(error)
    passPinCode.value = false
  } finally {
    isCallingApi.value = false
  }
}

const handleScroll = () => {
  // Lấy vị trí cuộn hiện tại
  let scrollPosition = window.innerHeight + window.scrollY

  // Lấy chiều cao tổng của tài liệu
  let documentHeight = document.body.offsetHeight

  // Kiểm tra nếu đã cuộn đến cuối trang
  if (
    !isLoading.value &&
    passPinCode.value &&
    nextContinuationToken &&
    scrollPosition >= documentHeight
  ) {
    loadImage()
  }
}

const handleEscKey = event => {
  if (event.key === 'Escape') {
    if (indexCurrentPreview.value >= 0) {
      closePreview()
    }
  } else if (event.key === 'ArrowLeft') {
    nextPreviewImage(-1)
  } else if (event.key === 'ArrowRight') {
    nextPreviewImage(1)
  }
}
const isAdminTct = ref(false)

const handleResize = () => {
  clientWidth.value = document.documentElement.clientWidth
}

onMounted(async () => {
  eventId.value = route.params.eventId

  const res = await getEventCollection(eventId.value)
  Object.assign(eventInfo, res)
  isAdminTct.value = eventInfo?.CreatedBy == 'admin_tct' ? true : false

  if (eventInfo.EventTime) {
    eventInfo.EventTime = dayjs(eventInfo.EventTime).format('DD/MM/YYYY')
  }

  Object.assign(event, eventInfo)

  route.meta.setTitle(event.EventName)

  nextTick(() => {
    document.querySelector('.pin-code-text')?.focus()
  })

  window.addEventListener('scroll', handleScroll)
  window.addEventListener('keydown', handleEscKey)
  window.addEventListener('resize', handleResize)

  // xử lý router
  const { query } = route

  if (query.mode == 'searchByPhoto') {
    selectedMode.value = MODE_SEARCH.PORTRAIT
  } else if (query?.searchByTag) {
    selectedMode.value = MODE_SEARCH.NAME
    faceSetups.value = (await getFaceSetup(eventId.value)) || []
    if (faceSetups.value.some(n => n.Name == query?.searchByTag)) {
      faceSearch.value = query?.searchByTag
    }
  }

  if (query.pinCode) {
    pinCode.value = query.pinCode
  }

  passPinCode.value = !eventInfo.HasPinCode
  if (passPinCode.value || pinCode.value) {
    viewImage()
  }

  removeFileNameEmpty()
})

const removeFileNameEmpty = () => {
  nextTick(() => {
    if (document.querySelector('span[files]'))
      document.querySelector('span[files]').style.display = 'none'
  })
}

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('keydown', handleEscKey)
  window.removeEventListener('resize', handleResize)
})

//#region  Chọn Option tìm kiếm
const MODE_SEARCH = {
  ALL: 0,
  PORTRAIT: 1,
  NAME: 2,
}

const selectedMode = ref(MODE_SEARCH.ALL)

const modes = ref([
  { name: 'Tất cả ảnh sự kiện', code: MODE_SEARCH.ALL },
  { name: 'Tìm theo tên (dành cho khách VIP) ', code: MODE_SEARCH.NAME },
  { name: 'Tìm theo ảnh chân dung', code: MODE_SEARCH.PORTRAIT },
])

const filteredModes = computed(() => {
  return isAdminTct.value
    ? modes.value.filter(mode => mode.code !== MODE_SEARCH.NAME)
    : modes.value
})

const faceSearch = ref()

const faceSetups = ref([])

const fileupload = ref()

/**
 *
 */
const onChangeModeSearch = async param => {
  if (param.value == MODE_SEARCH.NAME) {
    if (!faceSetups.value.length) {
      faceSetups.value = (await getFaceSetup(eventId.value)) || []
    }
    nextTick(() => {
      proxy.$refs['refFilterName'].onArrowDownKey()
    })
  }
  // tìm ảnh theo chân dung
  else if (param.value == MODE_SEARCH.PORTRAIT) {
    let queryObject = { mode: 'searchByPhoto' }
    if (pinCode.value && passPinCode.value && eventInfo.HasPinCode) {
      queryObject = { pinCode: pinCode.value, ...queryObject }
    }
    router.replace({
      name: 'eventView',
      params: { eventId: eventId.value },
      query: queryObject,
    })

    nextTick(() => {
      if (document.querySelector('span[files]'))
        document.querySelector('span[files]').style.display = 'none'
    })
    faceSearch.value = null
  } else {
    viewImage()
    faceSearch.value = null
  }
}

const onChangeSearchName = async param => {
  nextContinuationToken = null
  isLoading.value = true

  try {
    let queryObject = { searchByTag: param.value }
    if (pinCode.value && passPinCode.value && eventInfo.HasPinCode) {
      queryObject = { pinCode: pinCode.value, ...queryObject }
    }
    router.replace({
      name: 'eventView',
      params: { eventId: eventId.value },
      query: queryObject,
    })

    const res = await searchImageByNameFaceSetup(
      eventId.value,
      pinCode.value,
      param.value
    )
    listUrlImage.value = res.map(item => item.originalUrl)
    listUrlThumbnailImage.value = res.map(item => item.thumbnailUrl)
    if (checkIfMobile.value === true) {
      scrollIntoMain()
    }
  } catch (error) {
    listUrlImage.value = []
    listUrlThumbnailImage.value = []
    switch (error.message) {
      case 'Invalid PIN code.':
        toast.add({
          severity: 'error',
          summary: 'Mã pin không hợp lệ!',
          life: 3000,
        })
        break

      case 'Request failed with status code 403':
        toast.add({
          severity: 'error',
          summary: 'Mã pin không hợp lệ!',
          life: 3000,
        })
        break

      case 'PIN code is required in headers.':
        toast.add({
          severity: 'error',
          summary: 'Mã pin không được để trống!',
          life: 3000,
        })
        break
    }
    passPinCode.value = false
  }
  indexCurrentPreview.value = -1
  isLoading.value = false
}

const fileSelected = computed(() => {
  return fileupload.value?.files[0]
})

const transformStyle = computed(() => {
  return `transform: matrix(1, 0, 0, 1, -${
    indexCurrentPreview.value * clientWidth.value
  }, ${offsetY.value});`
})

const onSelectImage = async ({ files }) => {
  if (files.length) {
    isLoading.value = true

    nextContinuationToken = null
    let fileSearch = null

    try {
      const file = files[0]
      new Compressor(file, {
        quality: 0.8,
        convertSize: 2000000,
        convertTypes: ['image/png', 'image/gif', 'image/webp'],
        success: async compressedResult => {
          // Chuyển compressedResult từ Blob thành File
          const compressedFile = new File(
            [compressedResult], // Dữ liệu blob
            file.name, // Tên gốc của tệp ảnh
            { type: compressedResult.type } // Kiểu MIME của tệp
          )
          fileSearch = compressedFile
          const res = await searchByImage(
            eventId.value,
            pinCode.value,
            fileSearch
          )
          listUrlImage.value = res.map(item => item.originalUrl)
          listUrlThumbnailImage.value = res.map(item => item.thumbnailUrl)
          if (checkIfMobile.value === true) {
            scrollIntoMain()
          }
        },
        error: err => {
          listUrlImage.value = []
          listUrlThumbnailImage.value = []
          nextContinuationToken = null
          console.error(err.message)
          reject(err) // Đánh dấu file lỗi khi nén
        },
      })
    } catch (error) {
      listUrlImage.value = []
      listUrlThumbnailImage.value = []
      nextContinuationToken = null
    }
    indexCurrentPreview.value = -1
    isLoading.value = false
  }
}

const zip = new JSZip()

const getImageExtension = url => {
  // Tìm phần đuôi bằng regex, ví dụ .png, .jfif, .jpg
  const match = url.match(/\.(\w+)(?=\?|$)/)
  return match ? match[1] : null // Trả về phần đuôi hoặc null nếu không tìm thấy
}

const getFileName = url => {
  if (!url || typeof url !== 'string') {
    return ''
  }

  const path = url.split('?')[0]
  const fileNameWithPrefix = path.split('/').pop()

  if (fileNameWithPrefix && fileNameWithPrefix.includes('-')) {
    return fileNameWithPrefix.split('-').pop()
  }

  return fileNameWithPrefix || url
}

const downloadImage = async urlParam => {
  try {
    const fileName = getFileName(urlParam)
    isDownload.value = true

    if (urlParam) {
      // Tải xuống một ảnh duy nhất
      const response = await fetch(urlParam, {
        method: 'GET',
        mode: 'cors', // Đảm bảo xử lý CORS
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      })
      const blob = await response.blob()
      saveAs(blob, fileName) // Sử dụng tên file đã lấy từ URL
    } else {
      // Tạo file ZIP nếu tải xuống nhiều ảnh
      const folder = zip.folder('images') // Tạo thư mục "images" trong file ZIP

      await Promise.all(
        listUrlImage.value.map(async url => {
          const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
              'Content-Type': 'application/octet-stream',
            },
          })
          const blob = await response.blob()
          const arrayBuffer = await blob.arrayBuffer()

          // Lấy tên gốc của file từ URL
          const fileName = getFileName(url)
          folder.file(fileName, arrayBuffer) // Thêm file vào ZIP với tên gốc
        })
      )

      // Tạo file ZIP và tải về
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(zipBlob)
      link.download = 'images.zip'
      link.click()
    }
    isDownload.value = false
  } catch (error) {
    console.error('Error downloading the image(s):', error)
    isDownload.value = false
  }
}

const indexCurrentPreview = ref(-1)

// const nextPreviewImage = index => {
//   if (
//     (index > 0 && indexCurrentPreview.value < listUrlImage.value.length - 1) ||
//     (index < 0 && indexCurrentPreview.value > 0)
//   ) {
//     indexCurrentPreview.value += index
//   }
// }

const getUrlPreview = (url, index) => {
  if (indexCurrentPreview.value < 0) {
    indexCurrentPreview.value = index

    return url
  }
  return listUrlImage.value[indexCurrentPreview.value]
}

const getImagesPreview = () => {
  const index = indexCurrentPreview.value

  let start = Math.max(0, index - 2)
  let end = Math.min(listUrlImage.value.length - 1, start + 4)

  const result = []

  for (let i = start; i <= end; i++) {
    result.push({ index: i, value: listUrlThumbnailImage.value[i] }) // Thêm object chứa index và value vào mảng
  }

  return result
}

let originalImage = null

const loadOriginalImage = (url, index) => {
  // Xóa đối tượng Image trước đó để gián tiếp hủy yêu cầu
  if (originalImage) {
    originalImage.src = ''
    originalImage.onload = null
    originalImage.onerror = null
    originalImage = null
  }

  isOriginalImageLoaded.value = false
  indexCurrentPreview.value = index

  // Tạo ảnh mới cho lần tải hiện tại
  originalImage = new Image()
  originalImage.src = listUrlImage.value[index]

  originalImage.onload = () => {
    isOriginalImageLoaded.value = true
    loadNextOriginalImage()
  }

  originalImage.onerror = error => {
    isOriginalImageLoaded.value = false
  }
}

//Hàm load ảnh preview tiếp theo
const loadNextOriginalImage = () => {
  if (isOriginalImageLoaded.value != true) {
    return
  }

  const index = indexCurrentPreview.value

  // Gắn src để trình duyệt đọc ảnh --> Lưu cache
  if (index < listUrlImage.value.length - 1) {
    const preloadNextImage = new Image()
    preloadNextImage.src = listUrlImage.value[index + 1]
  }

  if (index > 0) {
    const preloadPreviousImage = new Image()
    preloadPreviousImage.src = listUrlImage.value[index - 1]
  }
}

const closePreview = () => {
  indexCurrentPreview.value = -1
}

const scrollIntoMain = () => {
  const main = document.querySelector('.images')
  main.scrollIntoView({ behavior: 'smooth' })
}

const back = () => {
  router.push({
    name: 'home',
  })
}

watch(
  () => indexCurrentPreview.value,
  newVale => {
    if (newVale >= 0) {
      document.querySelector('body').style.overflow = 'hidden'
    } else {
      document.querySelector('body').style.overflow = 'auto'
    }
  }
)

const checkIfMobile = computed(() => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera
  return /android|iPad|iPhone|iPod/i.test(userAgent)
})

const startX = ref(0)
const startY = ref(0)
const offsetX = ref(0)
const offsetY = ref(0)
const currentScale = ref(1) // Khởi tạo giá trị scale là 1
const distance = ref(0)
const isZooming = ref(false)
const isDragging = ref(false)

// Hàm tính khoảng cách giữa 2 ngón tay
const calculateDistance = (touch1, touch2) => {
  const dx = touch2.clientX - touch1.clientX
  const dy = touch2.clientY - touch1.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

const handleStart = event => {
  if (event.type === 'touchstart') {
    if (event.touches.length === 1) {
      startX.value = event.touches[0].clientX
      startY.value = event.touches[0].clientY
      isDragging.value = true
    } else if (event.touches.length === 2) {
      distance.value = calculateDistance(event.touches[0], event.touches[1])
      isZooming.value = true
    }
  } else if (event.type === 'dragstart') {
    startX.value = event.clientX
    startY.value = event.clientY
    isDragging.value = true
  }
}

const handleMove = event => {
  // Tính toán khoảng cách di chuyển trong cả 2 chiều X và Y
  let dx = 0
  let dy = 0

  // Xử lý nếu là sự kiện chạm hoặc kéo
  if (event.touches.length === 1) {
    const clientX = event.clientX || event.touches[0].clientX
    const clientY = event.clientY || event.touches[0].clientY

    dx = clientX - startX.value
    dy = clientY - startY.value

    if (Math.abs(dx) > Math.abs(dy)) {
      offsetX.value = dx
    } else if (Math.abs(dx) < Math.abs(dy) && !isZooming.value) {
      offsetY.value = dy
    }
  }
  // Xử lý nếu là sự kiện zoom ảnh
  else if (event.touches.length === 2) {
    // Xử lý zoom nếu có hai ngón tay
    const newDistance = calculateDistance(event.touches[0], event.touches[1])

    const scale = newDistance / distance.value
    currentScale.value = scale

    if (currentScale.value > 1) {
      isZooming.value = true
    } else {
      isZooming.value = false
      currentScale.value = 1
    }
  }
}

const handleEnd = async event => {
  const thresholdX = window.innerWidth / 12
  const thresholdY = window.innerHeight / 4

  if (!isZooming.value && isDragging.value) {
    if (Math.abs(offsetY.value) > thresholdY) {
      closePreview()
    } else if (offsetX.value > thresholdX) {
      await nextPreviewImage(-1)
    } else if (offsetX.value < -thresholdX) {
      await nextPreviewImage(1)
    }
  }

  // Đặt lại các giá trị sau khi kết thúc kéo hoặc zoom
  startX.value = 0
  startY.value = 0
  offsetX.value = 0
  offsetY.value = 0
  isDragging.value = false
}

const handleDragOver = event => {
  event.preventDefault()
}

const nextPreviewImage = async direction => {
  if (
    (direction === 1 &&
      indexCurrentPreview.value < listUrlImage.value.length - 1) ||
    (direction === -1 && indexCurrentPreview.value > 0)
  ) {
    // Kiểm tra xem có phải ảnh cuối cùng không
    if (
      indexCurrentPreview.value == listUrlImage.value.length - 2 &&
      nextContinuationToken &&
      passPinCode.value
    ) {
      await loadImage()
    }
    indexCurrentPreview.value += direction
    const previewContainer = document.querySelector('.preview-container')
    previewContainer.style.transition = 'transform 0.3s ease-out'
    previewContainer.style.transform = `translateX(-${
      indexCurrentPreview.value * window.innerWidth
    }px)`

    loadOriginalImage(null, indexCurrentPreview.value)
  }
}

const redrectEmis = () => {
  window.open('https://emis.misa.vn/emis-kindergarten/', '_blank')
}

function isIphone() {
  return /iPhone/i.test(navigator.userAgent)
}

const showGuide = ref(false)

//#endregion
</script>

<style lang="scss" scoped>
.event-view {
  .image-container {
    overflow: hidden;
    height: 580px;
    border-bottom-left-radius: 24px;
    border-bottom-right-radius: 24px;
    position: relative;
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
    .dialog-pin-code {
      position: absolute;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      background-color: rgba(72, 72, 72, 0.7);
      top: 0;
      left: 0;

      .wrap {
        background: white;
        border-radius: 16px;
        width: 550px;
        max-width: calc(100vw - 32px);
        height: 192px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
      }
    }
  }

  .images {
    .container-image {
      .image-item {
        width: 100%;
        display: flex;
        justify-content: center;
        position: relative;

        &:hover {
          .image-item-hover {
            display: flex;
          }
        }

        .image-item-hover {
          display: none;
          position: absolute;
          background: rgba(0, 0, 0, 0.6);
          width: 100%;
          height: 100%;
          border-radius: 8px;
          justify-content: center;
          align-items: center;
        }
      }
      .image {
        width: 100%;
        max-width: 400px;
        height: 210px;
        background-repeat: no-repeat;
        background-size: cover;
        border-radius: 8px;
        overflow: hidden;
      }
      .download-image {
        position: absolute;
        bottom: 12px;
        right: 12px;
        width: 32px;
        height: 32px;
        background: white;
        border-radius: 50%;
        transition: 0.2s;
        &:hover {
          transform: scale(1.2);
        }
      }
    }
  }

  .cancel-btn {
    background: white;
    color: #26273d;
    border-color: #dfe5e8;
    &:hover {
      color: #26273d;
      background: #dfe5e8;
      border-color: #dfe5e8;
    }
  }

  :deep(.thumbnail-event) {
    transform: translateY(calc((500px - 100%) / 2));
    object-fit: cover;
  }

  :deep(.p-image-preview:hover > .p-image-preview-mask) {
    border-radius: 8px;
  }

  .event-name {
    font-size: 32px;
  }

  .file-name {
    height: 36px;
    border: 1px solid #dfe5e8;
    border-radius: 8px;
    padding: 7px 12px;
    color: #000000;
  }

  .event-des {
    border-top: 1px solid #d8e1ea;
  }
}

:deep(.has-file) {
  background: white;
  color: #26273d;
  border-color: #dfe5e8;
  &:hover {
    color: #26273d !important;
    background: #dfe5e8 !important;
    border-color: #dfe5e8 !important;
  }
}

.event-name-mobile {
  border-bottom: 1px solid #d8e1ea;
}

.preview-wrap {
  position: fixed;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(0, 0, 0, 0.8);
  z-index: 100;
  .header-mobile {
    position: absolute;
    top: 76px;
    left: 26px;
    .tag-name-text {
      border-radius: 8px;
    }
  }

  .close-btn {
    position: absolute;
    top: 24px;
    left: 24px;
    border-radius: 50%;
    z-index: 1;
    &:hover {
      background-color: rgba(0, 0, 0, 0.4);
    }
  }
  .preview-header {
    justify-content: space-between;
    width: 58%;

    .tag-name-text {
      background: #bbeadb;
      border-radius: 8px;
    }
  }
  .preview-content {
    .image-preview {
      height: 76vh;
    }

    .next-btn,
    .back-btn {
      position: absolute;
      top: 50%;
      width: 60px;
      height: 80%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      left: 0;

      .icon {
        border-radius: 50%;

        &:hover {
          background-color: rgba(0, 0, 0, 0.4);
        }
      }
    }

    .next-btn {
      right: 0;
      left: unset;
    }
  }
  .preview-content {
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preview-container {
    cursor: grab;
    display: flex;
    transition: transform 0.3s ease-out;
    width: 100%;
    will-change: transform;

    &.is-dragging {
      cursor: grabbing !important;
    }
  }

  .image-preview {
    flex-shrink: 0;
    width: 100vw;
    height: auto;
    max-height: 100%;
    object-fit: contain;
  }

  .preview-footer {
    .preview-item {
      height: 70px;
      width: 108px;
      border-radius: 8px;
      background-repeat: no-repeat;
      background-size: cover;
      background-position: center;
      &.selected {
        border: 3px solid #2f80ed;
      }
    }
  }
  .preview-footer-mobile {
    justify-content: space-between;
    color: white;
    position: absolute;
    top: 24px;
    width: 100%;
    padding: 0 24px;
  }
}

$mobile-width: 639px;

@media all and (max-width: $mobile-width) {
  .preview-content {
    position: relative;
    overflow: hidden;
    width: 100vw;
    height: 100vh;
  }

  .preview-container {
    display: flex;
    transition: transform 0.3s ease-out;
    width: 100%;
    height: 100vh;
    will-change: transform;
    align-items: center;
  }

  .image-preview {
    flex-shrink: 0;
    width: 100vw;
    height: 100vh;
    object-fit: cover;
    padding: 8px;
  }
  .image-container {
    height: 235px !important;
    border-radius: 8px !important;
    .dialog-pin-code {
      .wrap {
        width: 330px !important;
        height: 112px !important;
        .pin-code-text::placeholder {
          text-align: center;
        }
      }
    }
  }
  .p-fileupload {
    width: 100%;
  }

  .preview-wrap {
    background: #000000;
    .image-preview {
      height: unset !important;
      width: 100vw;
    }
    .next-btn,
    .back-btn {
      .icon {
        background-color: rgba(0, 0, 0, 0.4);
        border-radius: 50%;
      }
    }

    .close-btn {
      position: absolute;
      left: 16px;
      top: 16px !important;
      z-index: 1;
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

.info-iphone {
  color: #01b58a;
  position: absolute;
  background: #bbeadb;
  bottom: 150px;
  transform: translateX(-50%);
  left: 50%;
  padding: 8px 12px;
  border-radius: 8px;
  min-width: 210px;
}

.guide-iphone-container {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  .guide-iphone {
    background: white;
    padding: 16px;
    border-radius: 24px;
    width: calc(100% - 48px);
    .btn-close-guide {
      color: #01b58a;
      height: 52px;
      text-align: center;
      line-height: 52px;
      cursor: pointer;
    }
  }
}
</style>
