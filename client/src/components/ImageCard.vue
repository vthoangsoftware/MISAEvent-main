<!-- src/components/EventCard.vue -->
<template>
  <div class="container-image flex justify-center cursor-pointer">
    <div class="image-item">
      <div
        v-show="!loading"
        class="image"
        :style="{
          backgroundImage: `url(${url})`,
        }"
      >
        <img
          class="hidden"
          :src="url"
          @load="loading = false"
          alt="Event Image"
        />
      </div>
      <Skeleton
        v-if="loading"
        height="14rem"
        class="skelecton-thumbnail"
      ></Skeleton>

      <div
        class="image-item-hover"
        v-show="!loading"
        @click="$emit('loadOriginalImage', url, index)"
      >
        <div class="icon-zoom icon24 zoom"></div>
        <div
          v-if="!isIphone()"
          class="download-image flex justify-center items-center"
          @click.stop="$emit('downloadImage', listUrlImage[index])"
        >
          <div class="icon24 download-v2"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, watch } from 'vue'

import { formatDate } from '@/commons/commonFunction.js'
import Skeleton from 'primevue/skeleton'
export default defineComponent({
  name: 'EventCard',
  components: {
    Skeleton,
  },
  props: ['url', 'index', 'listUrlImage', 'isLoading'],
  setup(props) {
    const loading = ref(true)

    const setLoading = value => {
      loading.value = value
    }

    watch(
      () => props.isLoading,
      newVal => {
        loading.value = newVal
      }
    )

    function isIphone() {
      return /iPhone/i.test(navigator.userAgent)
    }

    return {
      loading,
      formatDate,
      setLoading,
      isIphone,
    }
  },
})
</script>

<style lang="scss" scoped>
.container-image {
  .image-item {
    width: 100%;
    display: flex;
    justify-content: center;
    position: relative;
    min-height: 120px;

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
    background-position: center;
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

$mobile-width: 639px;

@media all and (max-width: $mobile-width) {
  .container-image {
    .image {
      height: 120px !important;
    }
  }
}
</style>
