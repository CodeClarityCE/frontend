<script lang="ts" setup>
import { ref, nextTick, type Ref } from 'vue';

const compRef = ref(null);
const show_modal: Ref<any> = ref(false);

interface Props {
    tracker?: any;
    leftOffset?: number;
    topOffset?: number;
    position?: any;
    showTitleDivider?: boolean;
    showTitle?: boolean;
    showSubTitle?: boolean;
    padding?: boolean;
    marginTarget?: number;
}

const props = withDefaults(defineProps<Props>(), {
    tracker: null,
    leftOffset: 0,
    topOffset: 0,
    position: 'top',
    showTitleDivider: true,
    showTitle: true,
    showSubTitle: true,
    padding: true,
    marginTarget: 15
});

const top = ref(0);
const left: Ref<any> = ref(0);
const right: Ref<any> = ref(0);
const tip_top = ref(10);
const id = `id-${  random().toString()}`;

const listener = (event: any) => {
    if (event.target !== compRef.value && event.composedPath().includes(compRef.value)) {
        return;
    }
    hide();
};

function toggle() {
    if (!show_modal.value) {
        show();
    } else {
        hide();
    }
}

function show() {
    tip_top.value = 10;
    const trackedDom = document.getElementById(props.tracker);
    if (trackedDom) {
        const offset = getOffset(trackedDom, props.position);
        // console.log(offset);
        if (offset) {
            top.value = offset.top + props.topOffset;
            if (props.position.includes('-left')) {
                right.value = offset.left;
                left.value = null;
            } else {
                left.value = offset.left;
                right.value = null;
            }
        }
    }
    show_modal.value = true;
    // updatePos = true;
    setTimeout(() => {
        window.addEventListener('click', listener);
    }, 10);
    nextTick(() => {
        reposition();
    });
    window.addEventListener('resize', () => {
        reposition();
    });
}

function reposition() {
    const trackedDom = document.getElementById(props.tracker);
    const modal = document.querySelector(`#${id} > .centered-modal-content`);
    if (!modal || !trackedDom) {
        return;
    }
    const modalHeight = modal.clientHeight;
    const modalWidth = modal.clientWidth;

    if (trackedDom) {
        const offset = getOffset(trackedDom, props.position);
        if (offset) {
            // console.log(offset);
            top.value = offset.top + props.topOffset;
            if (props.position.includes('-left')) {
                left.value = offset.left;
                left.value -= modalWidth;
                left.value -= trackedDom.clientWidth;
            } else {
                left.value = offset.left;
            }
        }
    }

    let overwritePosition = props.position;
    const parentRelative = trackedDom.closest('.relative-container');
    let availabeHeight = window.innerHeight;
    let topPos = top.value;

    if (parentRelative) {
        const isScrolledParent = parentRelative ? parentRelative.scrollTop > 0 : false;
        if (isScrolledParent) {
            topPos -= parentRelative.scrollTop;
        }
        availabeHeight = parentRelative.clientHeight;
    }

    const isOverflowingY = topPos + modalHeight >= availabeHeight;

    if (isOverflowingY) {
        overwritePosition = 'bottom';
    }

    if (props.position === 'bottom' || overwritePosition === 'bottom') {
        console.log('bottom');

        let subtract = modalHeight;
        const subtitle = document.querySelector(`#${id} > .centered-modal-subtitle`);
        if (subtitle) subtract += subtitle.clientHeight;
        if (props.showTitle)
            subtract += document.querySelector(`#${id} > .centered-modal-title`)!.clientHeight;
        if (props.showTitleDivider)
            subtract += document.querySelector(
                `#${id} > .centered-modal-title-content-divider`
            )!.clientHeight;
        top.value -= subtract;
        if (trackedDom && props.position === 'top') {
            top.value += trackedDom.clientHeight;
        }
        tip_top.value += subtract;
    }
    if (props.position === 'middle') {
        let subtract = modalHeight / 2;
        const subtitle = document.querySelector(`#${id} > .centered-modal-subtitle`);
        if (subtitle) subtract += subtitle.clientHeight;
        if (props.showTitle)
            subtract += document.querySelector(`#${id} > .centered-modal-title`)!.clientHeight;
        if (props.showTitleDivider)
            subtract += document.querySelector(
                `#${id} > .centered-modal-title-content-divider`
            )!.clientHeight;
        top.value -= subtract;
        tip_top.value += subtract;
    }
}

function hide() {
    show_modal.value = false;
    setTimeout(() => {
        window.removeEventListener('click', listener);
    }, 10);
}

function getOffset(el: any, position: string) {
    const top = el.offsetTop;
    const left = el.offsetLeft;
    if (position === 'top') {
        return {
            left: left + el.offsetWidth + props.marginTarget,
            top: top
        };
    } else if (position === 'middle') {
        return {
            left: left + el.offsetWidth + props.marginTarget,
            top: top + el.offsetHeight / 2
        };
    } else if (position === 'bottom') {
        return {
            left: left + el.offsetWidth + props.marginTarget,
            top: top + el.offsetHeight
        };
    } else if (position === 'top-left') {
        return {
            left: left + el.offsetWidth - props.marginTarget,
            top: top
        };
    } else if (position === 'middle-left') {
        return {
            left: left + el.offsetWidth - props.marginTarget,
            top: top + el.offsetHeight / 2
        };
    } else if (position === 'bottom-left') {
        return {
            left: left + el.offsetWidth - props.marginTarget,
            top: top + el.offsetHeight
        };
    }
}

function random() {
    return Math.floor(Math.random() * (100000000000 - 0 + 1)) + 0;
}

defineExpose({
    toggle,
    show,
    hide
});
</script>
<template>
    <Transition>
        <div
            v-if="show_modal"
            :id="id"
            ref="compRef"
            class="bg-white z-50 rounded-md shadow-2xl p-0 w-fit"
            :style="{
                position: 'absolute',
                top: top + 'px',
                left: left + 'px',
                right: right + 'px'
            }"
        >
            <!-- <div class="positioned-modal-tip" v-bind:style="{ 'top': tip_top+'px' }" style="position: absolute; left: -15px; border-top: 10px solid transparent; border-bottom: 10px solid transparent; border-right: 15px solid #ddd;"></div> -->
            <div
                v-if="$slots.title && showTitle"
                class="centered-modal-title rounded p-5 pb-0 font-semibold text-gray-700 text-lg"
            >
                <slot name="title"></slot>
            </div>
            <div
                v-if="$slots.subtitle && showSubTitle"
                class="centered-modal-subtitle py-2 px-5 font-normal text-gray-500"
            >
                <slot name="subtitle"></slot>
            </div>
            <div
                v-if="showTitleDivider"
                class="centered-modal-title-content-divider mx-5 h-px bg-slate-200 mt-2"
            ></div>
            <div v-if="padding" class="p-5">
                <slot name="content"></slot>
            </div>
            <div v-else class="centered-modal-content p-0">
                <slot name="content"></slot>
            </div>
        </div>
    </Transition>
</template>
