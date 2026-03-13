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
        <div id="text-client">
            <h2>Text Client</h2>
            <div class="text-client container">
                <div id="messages">
                    <div v-for="(msg, index) in apService.messages" class="message" :class="{ 'odd': index % 2 === 1 }" :key="msg.id">
                        <p v-if="msg.type == 'connected'">
                            🔌<span :class="msg.player.slot == apService.getThisPlayer().slot ? 'this-slot' : 'slot'">
                                {{ msg.player.name }}
                            </span> connected to the game {{ msg.player.game }} {{ msg.nodes }}
                        </p>
                        <!-- Default -->
                        <p v-else> 
                            {{ msg.text }}
                        </p>
                    </div>
                </div>
                <input type="text" id="message-input" placeholder="Type a message..." />
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

<style scoped>
.flex-row {
    display: flex;
    flex-direction: row;
    gap: 20px;
}

#text-client, #hints {
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 45vw;
}

.text-client.container {
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    border: 1px solid var(--container-border);
}

.message, .message p {
    margin: 0;
    padding: 0 5px;
}

.odd {
    background-color: #88888820;
}

.this-slot {
    font-weight: bold;
    color: var(--this-slot);
}
.slot {
    font-weight: bold;
    color: var(--slot);
}

.progression {
    color: var(--progression);
}

</style>