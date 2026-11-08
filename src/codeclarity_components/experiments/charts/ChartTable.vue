<template>
  <!-- The data behind a chart, folded away under "Show table" -->
  <details class="mt-2 text-sm">
    <summary class="cursor-pointer text-gray-500">Show table</summary>
    <table class="w-full mt-2">
      <slot />
    </table>
  </details>
</template>
