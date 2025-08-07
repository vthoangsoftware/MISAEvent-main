<template>
  <div
    v-if="!isNotAdmin"
    class="logo-header flex mb-6 mb:hidden cursor-pointer"
    @click="toHome"
  >
    <div class="ml-2 title-header text-xl font-bold">Ảnh sự kiện</div>
  </div>

  <RouterView />
 
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useRoute } from 'vue-router'

const route = useRoute()

const router = useRouter()

const isNotAdmin = computed(() => {
  return route.meta.isAdmin
})

const toHome = () => {
  router.push({
    name: 'home',
  })
}
</script>
<style lang="scss" scoped>
.logo-header {
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid #d8e1ea;
  padding: 8px 0;
  position: absolute;
  z-index: 10;
  background: white;
  border-radius: 16px;
  height: 52px;
  width: calc(100% - 32px);
  left: 16px;
  top: 16px;
  background-image: url('@/assets/icons/logo.svg');
  background-repeat: no-repeat;
  background-position: 16px center;
}
.link {
  &:hover {
    opacity: 0.7;
  }
}


</style>
