import { createApp } from "vue";
import "@/styles/global.css";
import TileEditor from "@/pages/TileEditor.vue";
import { seedDefaultTileMaps } from "@/utils/storage";

seedDefaultTileMaps();

createApp(TileEditor).mount("#app");
