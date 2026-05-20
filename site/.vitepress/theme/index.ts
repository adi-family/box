import DefaultTheme from "vitepress/theme";
import HeroBox from "./components/HeroBox.vue";
import Pipeline from "./components/Pipeline.vue";
import Install from "./components/Install.vue";
import "./style.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("HeroBox", HeroBox);
    app.component("Pipeline", Pipeline);
    app.component("Install", Install);
  },
};
