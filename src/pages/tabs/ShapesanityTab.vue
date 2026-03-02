<template>
    <div class="shapesanity-tab">
        <div v-for="shape in shapesanity"
            :key="shape.name"
            class="card"
            :class="(shape.found ? 'found' : !isInLogic(shape.logic) ? 'unavailable' : shape.hint != -1 ? 'hinted' : '')"
            @mouseenter="handleEnter($event, shape)"
            @mouseleave="handleLeave"
        >
            <img :src="shape.image" :alt="shape.code" />
        </div>

        <div
            v-if="openShape"
            ref="floating"
            :style="floatingStyles"
            class="shape-info"
        >
            <div class="shape-location">{{ openShape.location }}</div>
            <div class="shape-name">{{ openShape.name }}</div>
            <div class="shape-code">{{ openShape.code }}</div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useFloating, offset, flip, shift } from '@floating-ui/vue'
import { isInLogic } from '@/utils/archipelago-helper'

const props = defineProps({
    apService: {
        type: Object,
        required: true
    },
})

const shapesanity = ref([])
const openShape = ref(null)
const reference = ref(null)
const floating = ref(null)

const { floatingStyles } = useFloating(reference, floating, {
    placement: 'right',
    middleware: [offset(8), flip(), shift({ padding: 8 })],
})

onMounted(() => {
    shapesanity.value = props.apService.getShapesanityParsed() || []
})

function handleEnter(event, shape) {
    reference.value = event.currentTarget
    openShape.value = shape
}

function handleLeave() {
    openShape.value = null
}
</script>

<style>
.shapesanity-tab {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    padding: 16px;
}

.card {
    background: var(--container-bg);
    border-radius: 8px;
    padding: 0;
    text-align: center;
    position: relative;
    width: 5rem;
    transition: width 0.2s ease;
}

.card.unavailable {
    background: var(--unavailable-bg);
}
.card.hinted {
    background: var(--hinted-bg);
}
.card.found {
    background: var(--found-bg);
}

.card img {
    width: 5rem;
    height: auto;
    display: block;
}

.shape-info {
    position: absolute;
    background: var(--container-bg);
    border: 2px solid var(--container-border);
    border-radius: 8px;
    padding: 8px 12px;
    white-space: nowrap;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    z-index: 10;
}

.card.unavailable .shape-info {
    background: var(--unavailable-bg);
}

.card.hinted .shape-info {
    background: var(--hinted-bg);
}

.card.found .shape-info {
    background: var(--found-bg);
}

.card:hover .shape-info {
    opacity: 1;
    pointer-events: auto;
}


.shape-location,
.shape-name,
.shape-code {
    font-size: 0.9rem;
    text-align: left;
}

.shape-location {
    font-weight: bold;
    color: var(--text-primary, #fff);
}

.shape-name {
    color: var(--text-secondary, #ccc);
}

.shape-code {
    font-family: monospace;
    font-size: 0.8rem;
    color: var(--text-tertiary, #999);
}
</style>