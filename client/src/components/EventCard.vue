<!-- src/components/EventCard.vue -->
<template>
  <Card class="card-event shadow-xl rounded-lg overflow-hidden cursor-pointer">
    <template #header>
      <div class="container-image p-2 rounded-lg">
        <Skeleton v-if="loading" class="skelecton-thumbnail w-full"></Skeleton>
        <img
          v-show="!loading"
          @load="loading = false"
          class="object-cover w-full h-52 rounded-lg"
          :src="event.EventPreviewThumbnail"
          alt="Event Thumbnail"
        />
      </div>
    </template>
    <template #title>
      <div class="title-card flex flex-row">
        <div class="max-w-60 text-base font-bold truncate">
          {{ event.EventName }}
        </div>
        <div class="text-sm">
          {{ formatDate(event.EventTime) }}
        </div>
      </div>
    </template>
    <template #content>
      <p class="m-0 truncate">
        {{ event.EventDescription }}
      </p>
    </template>
  </Card>
</template>

<script>
import { defineComponent, ref } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import { formatDate } from '@/commons/commonFunction.js'
import Skeleton from 'primevue/skeleton'
export default defineComponent({
  name: 'EventCard',
  components: {
    Card,
    Button,
    Skeleton,
  },
  props: {
    event: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    const loading = ref(true)
    const viewEvent = () => {
      // Chuyển hướng đến chi tiết sự kiện
      this.$router.push({ path: `/event/${props.event.id}` })
    }

    return {
      loading,
      viewEvent,
      formatDate,
    }
  },
})
</script>

<style scoped>
.skelecton-thumbnail {
  height: 182px !important;
}

.card-event {
  min-width: 340px;
  max-width: 450px;
  box-shadow: 0px 4px 16px 0px #126a4b29;
}
.container-image {
  overflow: hidden;
}
.event-thumbnail {
  width: 100%;
  height: auto;
}
.title-card {
  justify-content: space-between;
}
</style>
