<template>
    <div class="shapesanity-tab">
        <div v-for="shape in shapesanity"
            v-show="isFiltered(shape)"
            :key="shape.name"
            class="card"
            :class="cardClass(shape)"
            :data-logic="shape.logic"
            :data-region="shape.region"
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
            <div v-if="settings.debug" class="shape-logic">Logic: {{ openShape.logic }}</div>
            <div v-if="settings.debug">Region: {{ openShape.region }}</div>
            <div v-if="settings.debug">Status: {{ determineShapeStatus(openShape) }}</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFloating, offset, flip, shift } from '@floating-ui/vue'
import { shapesanityRef, isInLogic, type ShapesanityEntry } from '@/utils/shapesanity-logic'
import { settings } from '@/stores/settings'

const openShape = ref<ShapesanityEntry | null>(null)
const reference = ref<HTMLElement | null>(null)
const floating = ref<HTMLElement | null>(null)

const { floatingStyles } = useFloating(reference, floating, {
    placement: 'right',
    middleware: [offset(8), flip(), shift({ padding: 8 })],
})

const shapesanity = computed(() => shapesanityRef.value)

const dashToCamel = {
    'found': 'found',
    'hinted': 'hinted',
    'in-logic': 'inLogic',
    'out-of-logic': 'outOfLogic',
    'hard-logic': 'hardLogic',
} as const

function determineShapeStatus(shape: ShapesanityEntry): 
        'found' | 'hinted' | 'in-logic' | 'out-of-logic' | 'hard-logic' {
    if (shape.found) return 'found'
    if (!isInLogic(shape.logic)) return 'out-of-logic'
    if (shape.hint) return 'hinted'
    if (isInLogic(shape.logic)) return 'in-logic'
    return 'hard-logic'
    // After implementing hard logic make `in-logic` default
}

function isFiltered(shape: ShapesanityEntry) {
    const status = determineShapeStatus(shape);
    return !settings.shapesanity.filter[dashToCamel[status]]
}

function cardClass(shape: ShapesanityEntry) {
    const status = determineShapeStatus(shape);
    return (settings.colors[ dashToCamel[status] ] !== "none") ? status : ''
}

function handleEnter(event: MouseEvent, shape: ShapesanityEntry) {
    reference.value = event.currentTarget as HTMLElement
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
    background: var(--container-bg, var(--bg-secondary));
    border-radius: 8px;
    padding: 0;
    text-align: center;
    position: relative;
    width: 5rem;
    transition: width 0.2s ease;
}

.card.out-of-logic {
    background: color-mix(in srgb, var(--color-out-of-logic) 25%, transparent);
}
.card.hinted {
    background: color-mix(in srgb, var(--color-hinted) 25%, transparent);
}
.card.in-logic {
    background: color-mix(in srgb, var(--color-in-logic) 25%, transparent);
}
.card.found {
    background: color-mix(in srgb, var(--color-found) 25%, transparent);
}

.card img {
    width: 5rem;
    height: auto;
    display: block;
}

.shape-info {
    position: absolute;
    background: var(--container-bg, var(--bg-secondary));
    border: 2px solid var(--container-border, var(--border-color));
    border-radius: 8px;
    padding: 8px 12px;
    white-space: nowrap;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    z-index: 10;
}

.card.out-of-logic .shape-info {
    background: color-mix(in srgb, var(--color-out-of-logic) 25%, transparent);
}

.card.hinted .shape-info {
    background: color-mix(in srgb, var(--color-hinted) 25%, transparent);
}

.card.found .shape-info {
    background: color-mix(in srgb, var(--color-found) 25%, transparent);
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
    color: var(--text-muted, #999);
}
</style>
