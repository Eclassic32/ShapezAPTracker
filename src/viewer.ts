import { createApp } from "vue";
import "@/styles/global.css";
import TileViewer from "@/pages/TileViewer.vue";
import { seedDefaultTileMaps } from "@/utils/storage";

seedDefaultTileMaps();

createApp(TileViewer).mount("#app");
