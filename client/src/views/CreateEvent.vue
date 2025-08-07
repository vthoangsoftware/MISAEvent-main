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
  <Dialog
    v-model:visible="isShowUploadDrive"
    modal
    header="Tải ảnh từ Google Drive"
  >
    <div class="flex flex-col gap-4 mb-4">
      <label for="username" class="font-semibold"
        >Đường liên kết Google Drive *</label
      >
      <InputText
        v-model="linkDrive"
        id="username"
        placeholder="Nhập đường liên kết thư mục ảnh"
        class="flex-auto"
        autocomplete="off"
      />
    </div>
    <div class="flex items-center gap-4 mb-8">
      <div class="icon24"></div>
      <span>
        Chia sẻ Thư mục ở chế độ <b> Bất kỳ ai có đường liên kết </b> đều có thể
        xem trước khi Xác nhận
      </span>
    </div>
    <div class="flex justify-end gap-2">
      <Button
        type="button"
        label="Huỷ"
        @click="() => (isShowUploadDrive = false)"
        severity="secondary"
      ></Button>
      <Button
        type="button"
        label="Xác nhận"
        @click="handleUploadImageByDrive"
      ></Button>
    </div>
  </Dialog>
  <div v-if="isAuth" class="container-create-event">
    <Toast position="bottom-right" />

    <div class="header rounded-2xl">
      <div class="header-left flex ml-6">
        <div class="icon24 back" @click="handleCancel"></div>
        <div class="ml-2 header-title font-bold text-xl">
          {{
            modeForm == MODE_INSERT
              ? 'Thêm sự kiện'
              : modeForm == MODE_VIEW
              ? 'Xem sự kiện'
              : 'Sửa sự kiện'
          }}
        </div>
      </div>
      <div class="header-right mr-6">
        <Button
          v-if="modeForm != MODE_VIEW"
          class="ml-4"
          type="button"
          label="Hủy"
          icon="icon24 cancel"
          @click="handleCancel"
          severity="secondary"
          outlined
        />
        <Button
          v-if="modeForm != MODE_VIEW"
          class="ml-4"
          type="button"
          label="Lưu"
          icon="icon24 save"
          :loading="loadingSave"
          :disabled="isShowProgressUpload"
          @click="handleSave"
        />
        <Button
          v-if="modeForm == MODE_VIEW"
          type="button"
          icon="icon24 edit"
          label="Sửa sự kiện"
          severity="secondary"
          @click="handleEdit"
        ></Button>
      </div>
    </div>

    <div class="form-container rounded-2xl">
      <div class="container-event-info">
        <div class="form">
          <div class="flex flex-col gap-4 mb-4">
            <label for="name" class="font-semibold w-24">Tên sự kiện</label>
            <InputText
              id="name"
              v-model="eventInfo.EventName"
              class="flex-auto"
              autocomplete="off"
              placeholder="Nhập tên sự kiện"
              :invalid="!eventInfo.EventName && isSaved"
              :disabled="modeForm == MODE_VIEW"
            />
          </div>
          <div class="flex mb-4">
            <div class="flex flex-col gap-2">
              <label for="eventTime" class="font-semibold"
                >Thời gian diễn ra</label
              >
              <DatePicker
                id="eventTime"
                dateFormat="dd/mm/yy"
                v-model="eventInfo.EventTime"
                showIcon
                fluid
                iconDisplay="input"
                inputId="templatedisplay"
                :invalid="!eventInfo.EventTime && isSaved"
                :disabled="modeForm == MODE_VIEW"
              >
                <template #inputicon="slotProps">
                  <div
                    class="icon24 date-picker-blue"
                    @click="slotProps.clickCallback"
                  />
                </template>
              </DatePicker>
            </div>

            <div class="flex flex-col gap-2 ml-6">
              <label for="pinCode" class="font-semibold">Mã PIN sự kiện</label>
              <InputText
                id="pinCode"
                v-model="eventInfo.PinCode"
                class="flex-auto"
                autocomplete="off"
                :disabled="modeForm == MODE_VIEW"
              />
            </div>
          </div>

          <div class="row flex flex-col gap-4 mb-4">
            <label for="description" class="font-semibold w-24">Mô tả</label>
            <Textarea
              id="description"
              placeholder="Nhập mô tả về sự kiện"
              v-model="eventInfo.EventDescription"
              autoResize
              rows="5"
              cols="30"
              style="resize: none"
              :invalid="!eventInfo.EventDescription && isSaved"
              :disabled="modeForm == MODE_VIEW"
            />
          </div>
          <div v-if="modeForm != MODE_INSERT" class="flex">
            <FileUpload
              mode="basic"
              chooseIcon="icon24 upload"
              accept="image/*"
              :maxFileSize="50000000"
              :multiple="true"
              chooseLabel="Tải ảnh lên"
              :disabled="isShowProgressUpload"
              @select="onFileSelect"
            >
              <template #filelabel>
                <div></div>
              </template>
            </FileUpload>
            <Button
              v-if="isShowAllOptions"
              class="ml-4"
              type="button"
              label="Tải từ Google Drive"
              icon="icon24 attachment"
              severity="secondary"
              outlined
              @click="() => (isShowUploadDrive = true)"
            ></Button>
          </div>
        </div>
        <div class="upload-thumbnail">
          <div class="row flex w-full h-full">
            <div class="flex flex-col gap-4 mb-8 w-full h-full">
              <FileUpload
                v-if="modeForm == MODE_INSERT || !previewThumbnail"
                id="=thumbnail"
                chooseIcon="icon24 upload"
                ref="fileupload"
                accept="image/*"
                :maxFileSize="50000000"
                @select="onSelectThumbnail"
              >
                <template #header="{ chooseCallback, files, clearCallback }">
                  <div
                    v-if="!files.length"
                    @click="chooseCallback()"
                    class="empty-upload-thumbnail cursor-pointer flex items-center justify-center flex-col w-full h-full"
                  >
                    <i class="icon_upload_image_large" />
                    <p class="mt-6 mb-0">Tải lên ảnh bìa</p>
                    <p class="mt-6 mb-0">Supports: PNG, JPG, JPEG, WEBP</p>
                  </div>
                  <div v-else class="image-thumbnail w-full h-full">
                    <div
                      v-for="file of files"
                      :key="file.name + file.type + file.size"
                      class="w-full h-full"
                    >
                      <img
                        class="w-full h-full object-cover"
                        role="presentation"
                        :alt="file.name"
                        :src="file.objectURL"
                      />

                      <Button
                        v-if="modeForm != MODE_VIEW && previewThumbnail"
                        class="btn-delete"
                        icon="icon24 delete"
                        severity="secondary"
                        @click="
                          () => {
                            handleDeleteThumbnail(clearCallback)
                          }
                        "
                      />
                    </div>
                  </div>
                </template>
                <!-- <template #content="{ files }">
                  <div
                    v-if="files.length > 0"
                    class="flex flex-col gap-8 pt-4"
                  ></div>
                </template> -->
              </FileUpload>
              <div v-else class="img-thumnail">
                <img :src="previewThumbnail" alt="" />
                <Button
                  v-if="modeForm != MODE_VIEW && previewThumbnail"
                  class="btn-delete"
                  icon="icon24 delete"
                  severity="secondary"
                  @click="
                    () => {
                      handleDeleteThumbnail()
                    }
                  "
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProgressBar
        v-if="isShowProgressUpload"
        class="ml-6"
        :uploadedImages="totalUploadedNow"
        :totalImages="totalImages"
        @cancel="cancelUpload"
      />
      <ProgressBar
        v-if="isShowProgressUploadDrive"
        class="ml-6 mt-4"
        titleUpload="Đang tải ảnh từ Google Drive"
        :showCount="false"
        :showAction="false"
        :uploadedImages="totalUploadedDriveNow"
        :totalImages="totalDriveImages"
        @cancel="cancelUploadDrive"
      />

      <div v-if="listImageUploaded.length > 0" class="text-xl font-bold m-6">
        Ảnh trong album ({{ listImageUploaded.length }})
      </div>
      <div
        v-if="listImageUploaded.length"
        class="grid ml-6 mr-6 2xl:grid-cols-5 xl:grid-cols-4 sm:grid-cols-2 md:grid-cols-3 gap-4"
      >
        <div
          class="container-image flex justify-center"
          v-for="(file, index) in listImageUploaded"
          :key="index"
        >
          <div class="flex-column w-full">
            <Image
              :src="file.ThumbnailUrl"
              alt="Image"
              preview
              class="image-item"
            >
              <template #previewicon>
                <div class="icon24 zoom"></div>
                <div
                  @click.stop="handleDeleteImage(file, index)"
                  class="download-image flex justify-center items-center"
                >
                  <div class="icon24 delete"></div>
                </div>
              </template>
              <template #image>
                <div
                  class="image"
                  :style="{
                    backgroundImage: `url(${file.ThumbnailUrl})`,
                  }"
                ></div>
              </template>
              <template #preview="slotProps">
                <img
                  class="image-preview"
                  :src="file.Url"
                  alt="preview"
                  :style="slotProps.style"
                  @click="slotProps.onClick"
                  loading="lazy"
                />
              </template>
            </Image>
            <div class="font-medium">
              {{ file.Name }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Message from 'primevue/message'
import DatePicker from 'primevue/datepicker'
import Textarea from 'primevue/textarea'
import FileUpload from 'primevue/fileupload'
import { ref, reactive, onMounted } from 'vue'
import Image from 'primevue/image'
import {
  createEventCollection,
  updateEventCollection,
  uploadThumbnail,
  getEventCollection,
} from '@/apis/eventApi'
import {
  uploadImages,
  uploadImagesByDrive,
  deleteImageByKey,
} from '@/apis/imageApi'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'
import { v4 as uuidv4 } from 'uuid'
import Dialog from 'primevue/dialog'
import Password from 'primevue/password'
import Compressor from 'compressorjs'
import ProgressBar from '@/components/ProgressBar.vue'
import { useRoute, useRouter } from 'vue-router'

const toast = useToast()
const router = useRouter()
const templatedisplay = ref()
const eventInfo = reactive({})
const listImageUploaded = ref([])
const imageThumbnail = ref(null)
const loadingSave = ref(false)
const isAuth = ref(false)
const visibleLogin = ref(true)
const isSaved = ref(false)
const isShowUploadDrive = ref(false)
const linkDrive = ref('')
const route = useRoute()

const MODE_INSERT = 1
const MODE_UPDATE = 2
const MODE_VIEW = 0
const modeForm = ref(MODE_INSERT)
const previewThumbnail = ref('')
const onSelectThumbnail = event => {
  const file = event.files[0]
  new Compressor(file, {
    quality: 0.5,
    convertSize: 500000,
    mimeType: 'image/jpeg',
    success: compressedResult => {
      const reader = new FileReader()
      reader.onload = e => {
        imageThumbnail.value = compressedResult
        previewThumbnail.value = e.target.result
      }
      reader.readAsDataURL(compressedResult)
    },
    error(err) {
      console.error(err.message)
    },
  })
}

const isShowProgressUpload = ref(false)
const totalUploadedNow = ref(0)
const totalImages = ref(0)

const pauseUpload = () => {}

const selectedFilesOld = ref([])
let worker = null
const cancelUpload = () => {
  if (worker) {
    worker.terminate() // Hủy worker
    worker = null
  }
  isShowProgressUpload.value = false
}

const onFileSelect = event => {
  isShowProgressUpload.value = true
  const files = Array.from(event.files)
  totalUploadedNow.value = 0
  totalImages.value = files.length
  const BATCH_SIZE = 10 // Số lượng ảnh mỗi lần upload
  let batchImage = [] // Mảng tạm lưu batch ảnh
  let indexBatch = 1
  let batchUpload = []
  let indexFile = 0
  // Khởi tạo worker
  worker = new Worker(
    new URL('@/services/compressorWorker.js', import.meta.url)
  )
  // Gửi danh sách file tới worker để nén
  worker.postMessage({ files })

  // Lắng nghe kết quả từ worker
  worker.onmessage = async event => {
    const { originalFile, compressedFile, error, progress } = event.data

    if (originalFile || compressedFile) {
      const fileToAdd = originalFile || compressedFile
      indexFile++
      batchImage.push(fileToAdd) // Thêm ảnh đã nén vào batch
      // Kiểm tra nếu batchImage đạt đến BATCH_SIZE thì upload
      if (batchImage.length === BATCH_SIZE) {
        batchUpload = [...batchImage]
        indexBatch++
        batchImage = [] // Xóa batch khi upload
        console.log('uploadBatch', batchUpload)
        const resUpload = await uploadImages(
          eventInfo.EventId,
          eventInfo.PinCode,
          batchUpload
        )
        listImageUploaded.value.push(...resUpload)
        totalUploadedNow.value += BATCH_SIZE

        if (totalUploadedNow.value == totalImages.value) {
          isShowProgressUpload.value = false
        }
        return
      }
      if (indexFile == files.length) {
        setTimeout(async () => {
          if (batchImage.length > 0 && files.length % BATCH_SIZE !== 0) {
            const resUpload = await uploadImages(
              eventInfo.EventId,
              eventInfo.PinCode,
              batchImage
            )
            listImageUploaded.value.push(...resUpload)
            totalUploadedNow.value += batchImage.length
            if (totalUploadedNow.value == totalImages.value) {
              isShowProgressUpload.value = false
            }
            worker.terminate()
          }
        })
      }
    } else if (error) {
      console.error('Error in worker:', error)
    } else if (progress) {
      console.log(
        `Compressed ${progress.completed} of ${progress.total} files.`
      )
    }
  }
}

const extractFolderId = driveLink => {
  const folderIdMatch = driveLink.match(/\/folders\/([a-zA-Z0-9_-]+)/)
  return folderIdMatch ? folderIdMatch[1] : null
}

const isShowProgressUploadDrive = ref(false)
const totalUploadedDriveNow = ref(0)
const totalDriveImages = ref(100)

const handleUploadImageByDrive = async () => {
  isShowUploadDrive.value = false
  totalUploadedDriveNow.value = 0
  totalDriveImages.value = 100
  eventInfo.EventId = eventInfo.EventId || uuidv4()
  const driveFolderId = extractFolderId(linkDrive.value)

  isShowProgressUploadDrive.value = true

  // Bắt đầu tiến trình giả tiến độ và giới hạn tối đa đến 90%
  const fakeProgressInterval = setInterval(() => {
    if (totalUploadedDriveNow.value < 90) {
      totalUploadedDriveNow.value += Math.floor(Math.random() * 5) + 1 // Tăng dần ngẫu nhiên
    } else {
      clearInterval(fakeProgressInterval)
    }
  }, 1000)

  // Thực hiện upload thực tế
  const res = await uploadImagesByDrive(eventInfo.EventId, driveFolderId)
  showSaveSuccess(`Upload ${res.length} ảnh từ Google Drive lên thành công.`)
  listImageUploaded.value.push(...res)
  totalUploadedDriveNow.value = 100
  isShowProgressUploadDrive.value = false
}

const cancelUploadDrive = () => {}

const handleBack = () => {}

const handleDeleteImage = async (file, index) => {
  const key = listImageUploaded.value[index].Key
  listImageUploaded.value.splice(index, 1)
  await deleteImageByKey(eventInfo.EventId, key, eventInfo.PinCode)
}
const isChangeThumbnail = ref(false)

const handleDeleteThumbnail = callback => {
  if (callback) {
    callback()
  }
  imageThumbnail.value = null
  previewThumbnail.value = ''
  // Xoá thumbnail không phải lúc thêm event là update
  if (modeForm.value != MODE_INSERT) {
    isChangeThumbnail.value = true
  }
}

const handleCancel = () => {
  router.push({ name: 'eventListAdmin' })
}

const handleEdit = () => {
  modeForm.value = MODE_UPDATE
}

const handleSave = async () => {
  try {
    isSaved.value = true
    const listFiledRequired = ['EventName', 'EventTime', 'EventDescription']
    let err = false
    for (const field of listFiledRequired) {
      if (!eventInfo[field]) {
        showSaveError('Thiếu thông tin')
        err = true
        break
      }
    }
    if (err) return

    // if (listImage.length <= 0) {
    //   showSaveError('Sự kiện có ít nhất 1 ảnh')
    //   return
    // }
    loadingSave.value = true
    if (modeForm.value == MODE_INSERT) {
      if (!imageThumbnail.value) {
        showSaveError('Thiếu ảnh bìa')
        return
      }
      eventInfo.EventId = eventInfo.EventId || uuidv4()
      let createdBy = localStorage.getItem('username')
      if (!createdBy) {
        showSaveError('Thiếu thông tin người tạo')
      }
      eventInfo.CreatedBy = createdBy
      await createEventCollection(eventInfo)
      const urlThumbnail = await uploadThumbnail(
        eventInfo.EventId,
        imageThumbnail.value
      )
      eventInfo.EventThumbnail = urlThumbnail.Url
      showSaveSuccess()
    } else if (modeForm.value == MODE_UPDATE) {
      await updateEventCollection(eventInfo)
      if (isChangeThumbnail.value) {
        const urlThumbnail = await uploadThumbnail(
          eventInfo.EventId,
          imageThumbnail.value
        )
        eventInfo.EventThumbnail = urlThumbnail.Url
      }
      showSaveSuccess('Sửa sự kiện thành công')
    }
    loadingSave.value = false
    modeForm.value = MODE_VIEW
  } catch (error) {
    loadingSave.value = false
    showSaveError()
  }
}

const showSaveSuccess = message => {
  toast.add({
    severity: 'success',
    summary: 'Thành công',
    detail: message || 'Thêm sự kiện thành công',
    life: 3000,
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
const handleLogin = () => {
  accounts.forEach(user => {
    if (user.username === username.value && user.password === password.value) {
      isShowAllOptions.value = user.username === 'admin'
      localStorage.setItem('showAllOptions', isShowAllOptions.value)
      localStorage.setItem('username', username.value)
      localStorage.setItem('password', password.value)
      isAuth.value = true
      visibleLogin.value = false
    }
  })
  if (!isAuth.value) {
    showSaveError('Tài khoản hoặc mật khẩu không đúng')
  }
}

onMounted(async () => {
  if (route.params.eventId) {
    eventInfo.EventId = route.params.eventId
    const res = await getEventCollection(eventInfo.EventId)
    Object.assign(eventInfo, res)
    modeForm.value = MODE_VIEW
    previewThumbnail.value = eventInfo.EventThumbnail
  }

  const savedUsername = localStorage.getItem('username')
  const savedPassword = localStorage.getItem('password')
  accounts.forEach(user => {
    if (user.username === savedUsername && user.password === savedPassword) {
      isShowAllOptions.value = savedUsername === 'admin'
      localStorage.setItem('showAllOptions', isShowAllOptions.value)
      isAuth.value = true
      visibleLogin.value = false
    }
  })

  if (!isAuth.value) {
    visibleLogin.value = true
  }
})
</script>

<style lang="scss" scoped>
.container-create-event {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100vh;
  background-image: url('@/assets/images/background.svg');
  background-repeat: no-repeat;
  background-size: cover;
  .header {
    margin: 16px;
    top: 0;
    left: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #fff;
    width: calc(100% - 32px);
    height: 60px;
  }
  .form-container {
    background-color: #fff;
    height: calc(100vh - 88px);
    margin: 16px;
    margin-top: 0;
    width: calc(100% - 32px);
    overflow: auto;
    .container-event-info {
      display: flex;
      margin: 24px;
    }

    .form {
      flex: 4;
      height: fit-content;
      padding-right: 120px;
    }

    .upload-thumbnail {
      flex: 6;

      height: fit-content;
      :deep(.p-fileupload) {
        border-radius: 12px;
        border: none;
      }
      :deep(.p-fileupload-content) {
        display: none;
        padding: 0;
      }

      :deep(.p-fileupload-header) {
        border: 1px #01b58a dashed;
        background-color: #edfcf6;
        border-radius: 12px;
        height: 368px;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0;
        overflow: hidden;
        position: relative;
      }

      .btn-delete {
        position: absolute;
        bottom: 16px;
        right: 16px;
      }
    }
    .img-thumnail {
      border-radius: 12px;
      overflow: hidden;
      height: fit-content;
      position: relative;
      img {
        width: 100%;
        object-fit: cover;
      }
    }
  }

  :deep(.p-datepicker-input-icon-container) {
    transform: translateY(-6px);
  }

  .container-image {
    .image-item {
      width: 100%;
      display: flex;
      justify-content: center;
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
</style>
