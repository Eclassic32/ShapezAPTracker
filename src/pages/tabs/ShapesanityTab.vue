<template>
    <div class="shapesanity-tab">
        <div v-for="shape in shapesanity" :key="shape.name" class="card">
            <div class="shape-name">{{ shape.name }}</div>
            <div class="shape-code">{{ shape.code }}</div>
        </div>
    </div>
</template>

<script>
import { fromShortKey } from '@/utils/shape-generator';

export default {
    name: 'ShapesanityTab',
    setup() {
        // Setup code here if needed
    },
    props: {
        apService: {
            type: Object,
            required: true
        },
    },
    data() {
        return {
            shapesanity: []
        };
    },
    mounted() {
        this.shapesanity = this.apService.getShapesanityParsed() || [];
    }
};

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
    padding: 16px;
    width: 150px;
    text-align: center;
}

.card.out-of-logic {
    background: var(--out-of-logic-bg);
}
.card.found {
    background: var(--found-bg);
}
</style>