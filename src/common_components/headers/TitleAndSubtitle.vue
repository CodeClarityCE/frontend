<template>
    <div class="flex gap-10 items-center">
        <div class="text-2xl flex flex-row gap-2 items-center">
            <slot name="title"></slot>
            <slot name="subtitle"></slot>
        </div>
        <div class="text-gray-500 font-medium">
            <slot name="description"></slot>
        </div>
    </div>
</template>
