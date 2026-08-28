<script setup lang="ts">
import { Check, ChevronDown, ChevronUp } from '@lucide/vue'
import {
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface Props {
  modelValue: string
  options: SelectOption[]
  placeholder?: string
  label: string
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  placeholder: 'เลือกรายการ',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const updateValue = (value: string | number | bigint | Record<string, unknown> | null) => {
  emit('update:modelValue', value == null ? '' : String(value))
}
</script>

<template>
  <SelectRoot :model-value="modelValue" :disabled="disabled" @update:model-value="updateValue">
    <SelectTrigger
      class="flex min-h-11 w-full items-center justify-between gap-3 rounded-control border border-divider bg-canvas px-3 text-left text-sm font-normal text-ink transition-colors hover:border-gray-300 data-[placeholder]:text-muted disabled:opacity-55"
      :aria-label="label"
    >
      <SelectValue :placeholder="placeholder" />
      <SelectIcon class="shrink-0 text-muted">
        <ChevronDown :size="18" aria-hidden="true" />
      </SelectIcon>
    </SelectTrigger>

    <SelectPortal>
      <SelectContent
        position="popper"
        :side-offset="6"
        class="z-[90] min-w-[var(--reka-select-trigger-width)] overflow-hidden rounded-panel border border-divider bg-canvas p-1.5 shadow-xl"
      >
        <SelectScrollUpButton class="flex h-9 items-center justify-center text-muted">
          <ChevronUp :size="17" aria-hidden="true" />
        </SelectScrollUpButton>
        <SelectViewport class="max-h-72">
          <SelectItem
            v-for="option in options"
            :key="option.value"
            :value="option.value"
            :disabled="option.disabled"
            class="relative flex min-h-11 cursor-pointer select-none items-center rounded-control py-2 pr-10 pl-3 text-sm text-ink outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-45 data-[highlighted]:bg-warning-soft data-[state=checked]:font-semibold"
          >
            <SelectItemText>{{ option.label }}</SelectItemText>
            <SelectItemIndicator class="absolute right-3 grid size-6 place-items-center text-warning">
              <Check :size="17" stroke-width="2.5" aria-hidden="true" />
            </SelectItemIndicator>
          </SelectItem>
        </SelectViewport>
        <SelectScrollDownButton class="flex h-9 items-center justify-center text-muted">
          <ChevronDown :size="17" aria-hidden="true" />
        </SelectScrollDownButton>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
