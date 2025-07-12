import { render, type RenderOptions } from '@testing-library/vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import type { Component } from 'vue'

// Basic router for testing
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/:pathMatch(.*)*', component: { template: '<div>Not Found</div>' } }
  ]
})

interface CustomRenderOptions extends Omit<RenderOptions, 'global'> {
  global?: RenderOptions['global'] & {
    plugins?: any[]
    mocks?: Record<string, any>
  }
}

export function renderWithProviders(
  component: Component,
  options: CustomRenderOptions = {}
) {
  const pinia = createPinia()
  
  const defaultGlobal = {
    plugins: [pinia, router],
    mocks: {
      $t: (key: string) => key, // Mock i18n
    },
    stubs: {
      'router-link': true,
      'router-view': true,
    },
  }

  return render(component, {
    ...options,
    global: {
      ...defaultGlobal,
      ...options.global,
      plugins: [
        ...defaultGlobal.plugins,
        ...(options.global?.plugins || [])
      ],
      mocks: {
        ...defaultGlobal.mocks,
        ...options.global?.mocks,
      },
    },
  })
}

export * from '@testing-library/vue'
export { userEvent } from '@testing-library/user-event'