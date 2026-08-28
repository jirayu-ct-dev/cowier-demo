<script setup lang="ts">
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'

export interface TabOption { value: string, label: string }

interface Props {
  tabs: TabOption[]
  defaultValue: string
  label: string
}

defineProps<Props>()
</script>

<template>
  <TabsRoot :default-value="defaultValue">
    <TabsList class="inline-flex max-w-full overflow-x-auto rounded-control bg-surface p-1" :aria-label="label">
      <TabsTrigger
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
        class="min-h-10 shrink-0 rounded-md px-4 text-sm font-semibold text-muted data-[state=active]:bg-canvas data-[state=active]:text-ink data-[state=active]:shadow-sm"
      >
        {{ tab.label }}
      </TabsTrigger>
    </TabsList>
    <TabsContent v-for="tab in tabs" :key="tab.value" :value="tab.value" class="mt-4 rounded-control border border-divider p-4 text-sm text-muted">
      <slot :name="tab.value" />
    </TabsContent>
  </TabsRoot>
</template>
