<template>
  <div class="progress-container">
    <div class="flex-column flex-1">
      <div class="progress-header pb-2">
        <span v-if="titleUpload" class="font-bold">{{ titleUpload }}</span>
        <span v-else class="font-bold"
          >Đang tải lên {{ totalImages }} ảnh từ máy tính</span
        >
        <span v-if="showCount">{{ uploadedImages }}/{{ totalImages }}</span>
      </div>
      <div class="progress-bar">
        <div class="progress" :style="{ width: progress + '%' }"></div>
      </div>
    </div>
    <div v-if="showAction" class="progress-actions ml-4">
      <button @click="cancelUpload" class="btn-icon icon24 cancel"></button>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { computed } from 'vue'

export default {
  props: {
    uploadedImages: {
      type: Number,
      default: 0,
    },
    totalImages: {
      type: Number,
      default: 100,
    },
    showCount: {
      type: Boolean,
      default: true,
    },
    showAction: {
      type: Boolean,
      default: true,
    },
    titleUpload: {
      type: String,
      default: '',
    },
  },
  setup(props, { emit }) {
    // Tính toán phần trăm tiến độ
    const progress = computed(
      () => (props.uploadedImages / props.totalImages) * 100,
    )

    const isPause = ref(false)

    const playUpload = () => {
      isPause.value = false
      emit('play')
    }

    // Phương thức để tạm dừng
    const pauseUpload = () => {
      isPause.value = true
      emit('pause')
    }

    // Phương thức để hủy
    const cancelUpload = () => emit('cancel')

    return {
      isPause,
      progress,
      pauseUpload,
      playUpload,
      cancelUpload,
    }
  },
}
</script>

<style lang="scss" scoped>
.progress-container {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px;
  width: 452px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
}

.progress-bar {
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress {
  height: 100%;
  background-color: #22c55e;
  transition: width 0.3s ease;
}

.progress-actions {
  display: flex;
  justify-content: flex-end;
  gap: 5px;
  transform: translateY(10px);
}

.btn-icon {
  border: none;
  border-radius: 50%;
  padding: 5px;
  cursor: pointer;
  font-size: 16px;
  &:hover {
    opacity: 0.5;
  }
}
</style>
