<script setup lang="ts">
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot } from 'reka-ui'

const mobileNavigationOpen = ref(false)
const route = useRoute()
const isDevelopment = import.meta.dev
const hasDashboardToolbar = computed(() => route.path.startsWith('/staff/supervision/groups'))

watch(() => route.fullPath, () => {
  mobileNavigationOpen.value = false
})
</script>

<template>
  <div class="min-h-dvh bg-surface">
    <div class="fixed inset-y-0 left-0 z-40 hidden lg:block"><AppSidebar /></div>

    <DialogRoot v-model:open="mobileNavigationOpen">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-40 bg-black/45 lg:hidden" />
        <DialogContent class="fixed inset-y-0 left-0 z-50 w-64 outline-none lg:hidden" aria-label="เมนูหลัก">
          <AppSidebar @navigate="mobileNavigationOpen = false" />
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <div class="lg:pl-64">
      <AppHeader @open-navigation="mobileNavigationOpen = true" />
      <DashboardToolbar v-if="hasDashboardToolbar" />
      <main id="main-content" class="mx-auto w-full max-w-[1480px] p-4 sm:p-6 lg:p-8"><slot /></main>
    </div>

    <ClientOnly>
      <ScenarioPanel v-if="isDevelopment" />
      <AppToaster />
    </ClientOnly>
  </div>
</template>
