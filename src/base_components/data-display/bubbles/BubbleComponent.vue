<script lang="ts" setup>
const props = defineProps({
  slim: {
    type: Boolean,
    required: false,
  },
  blue: {
    type: Boolean,
    required: false,
  },
  neutral: {
    type: Boolean,
    required: false,
  },
  bad: {
    type: Boolean,
    required: false,
  },
  positive: {
    type: Boolean,
    required: false,
  },
  patchable: {
    type: Boolean,
    required: false,
  },
  notPatchable: {
    type: Boolean,
    required: false,
  },
  partiallyPatchable: {
    type: Boolean,
    required: false,
  },
});
</script>
<template>
  <div
    :class="{
      'flex flex-row justify-between items-center gap-2 rounded-3xl w-fit': true,
      'py-0.5 px-2 text-sm': props.slim,
      'py-2 px-3': !props.slim,
      'bg-primary text-white': props.blue,
      'bg-[#f4f8ff] text-[#505050]': props.neutral,
      'bg-[#f0d1d1] text-[#aa6d6d]': props.bad,
      'bg-[#c0e8b3] text-[#69b751]': props.positive,
      'bg-[#e9ffe8] text-[#78995a] font-semibold': props.patchable,
      'bg-[#ffe8e8] text-[#995a5a] font-semibold': props.notPatchable,
      'bg-[#fff6e8] text-[#99705a] font-semibold': props.partiallyPatchable,
      'bg-[#f2f2f2] hover:bg-[#0000001a]':
        !props.blue && !props.neutral && !props.bad && !props.positive,
    }"
  >
    <slot name="content"></slot>
  </div>
</template>
