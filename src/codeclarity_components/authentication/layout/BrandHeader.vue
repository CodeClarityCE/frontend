<template>
  <header class="flex items-center px-8 py-6">
    <!-- The logo leads to the login page, the entry point when signed out. -->
    <RouterLink
      :to="{ name: 'login' }"
      class="flex items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <img
        src="@/assets/images/logos/logo.svg"
        alt="CodeClarity"
        class="h-9 w-auto"
      />
      <span
        aria-hidden="true"
        class="text-xl font-bold tracking-tight text-foreground-strong"
      >
        CodeClarity
      </span>
    </RouterLink>
  </header>
</template>
