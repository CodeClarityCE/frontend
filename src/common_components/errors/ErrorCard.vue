<template>
    <div
        class="p-5 rounded text-base border border-solid border-gray-300"
        style="background-color: #ffe8e8"
    >
        <div class="font-light" style="color: #995a5a">
            <div class="flex flex-row justify-start items-center gap-2">
                <slot name="content"></slot>
            </div>
        </div>
    </div>
</template>
