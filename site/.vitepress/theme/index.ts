import { h } from "vue";
import DefaultTheme from "vitepress/theme";
import BoxScene from "./components/BoxScene.vue";
import "./style.css";

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      "home-hero-image": () => h(BoxScene),
    });
  },
};
