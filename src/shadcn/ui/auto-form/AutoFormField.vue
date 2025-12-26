<script setup lang="ts" generic="U extends ZodAny">
import { computed } from 'vue';
import type { ZodAny } from 'zod';
import { DEFAULT_ZOD_HANDLERS, INPUT_COMPONENTS } from './constant';
import useDependencies from './dependencies';
import type { Config, ConfigItem, Shape } from './interface';

const props = defineProps<{
    fieldName: string;
    shape: Shape;
    config?: ConfigItem | Config<U>;
}>();

function isValidConfig(config: any): config is ConfigItem {
    return !!config?.component;
}

const delegatedProps = computed(() => {
    if (['ZodObject', 'ZodArray'].includes(props.shape?.type))
        return { schema: props.shape?.schema };
    return undefined;
});

const resolvedComponent = computed(() => {
    if (isValidConfig(props.config)) {
        return typeof props.config.component === 'string'
            ? INPUT_COMPONENTS[props.config.component]
            : props.config.component;
    }
    const shapeType = props.shape.type;
    if (shapeType) {
        const handlerKey = DEFAULT_ZOD_HANDLERS[shapeType];
        if (handlerKey) {
            return INPUT_COMPONENTS[handlerKey];
        }
    }
    return undefined;
});

const { isDisabled, isHidden, isRequired, overrideOptions } = useDependencies(props.fieldName);
</script>

<template>
    <component
        :is="resolvedComponent"
        v-if="!isHidden"
        :field-name="fieldName"
        :label="shape.schema?.description"
        :required="isRequired || shape.required"
        :options="overrideOptions || shape.options"
        :disabled="isDisabled"
        :config="config"
        v-bind="delegatedProps"
    >
        <slot />
    </component>
</template>
