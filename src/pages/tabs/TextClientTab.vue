<template>
    <div class="flex-row">
        <div id="hints">
            <button @click="updateHints">Refresh Hints</button>
            <div>
                <h2>Received Hints</h2>
                <p v-for="hint in receivedHints"  :key="hint.item">
                    {{ hint.receiver.name }}'s {{ hint.item }} at {{ hint.location }} ({{ hint.type }})
                </p>
            </div>
            <div>
                <h2>Sent Hints</h2>
                <p v-for="hint in sentHints"  :key="hint.item">
                    {{ hint.item }} at {{ hint.sender.name }}'s {{ hint.location }} ({{ hint.type }})
                </p>
            </div>
        </div>
    </div>
</template>

<script>
import { markRaw } from 'vue';

export default {
    name: 'TextClientTab',
    props: {
        apService: {
            type: Object,
            required: true
        },
    },
    data() {
        return {
            receivedHints: [],
            sentHints: [],
            showFoundTrashHints: false
        };
    },
    mounted() {
        this.updateHints();
    },

    methods: {
        updateHints() {
            console.log("Updating Hints");

            this.receivedHints = [];
            this.sentHints = [];
            
            const player = this.apService.getThisPlayer();
            const hints = this.apService.getHints();
            this.receivedHints = hints.filter(hint => hint.sender.slot == player.slot);
            this.sentHints = hints.filter(hint => hint.receiver.slot == player.slot);
        }
    }

};

</script>