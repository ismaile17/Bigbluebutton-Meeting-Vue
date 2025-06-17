// ===============================|| Blank Layout ||=============================== //
<template>
  <div
    class="overlay"
    v-if="layout.loading"
    :style="layout.loading ? 'display:block' : 'display:none'"
  >
    <img
      src="./../assets/images/logo-animated.gif"
      style="position: absolute; margin: auto; top: 0; left: 0; right: 0; bottom: 0; width: 300px"
    />
  </div>

  <v-app>
    <RouterView />
  </v-app>
  <Toast></Toast>
</template>
<script setup lang="ts">
import { useLayoutStore } from '@/stores/layout'
import { RouterView } from 'vue-router'
// const layout = useLayoutStore();
const layout = useLayoutStore()
</script>
<style lang="scss">
/* whatsapp butonu css*/
.float {
  position: fixed;
  width: 60px;
  height: 60px;
  bottom: 10px;
  right: 40px;
  background-color: #25d366;
  color: #fff;
  border-radius: 50px;
  text-align: center;
  font-size: 30px;
  box-shadow: 2px 2px 3px #999;
  z-index: 100;
}

.my-float {
  margin-top: 16px;
}
/* whatsapp butonu css*/

.overlay {
  position: fixed; /* Sit on top of the page content */
  width: 100%; /* Full width (cover the whole page) */
  height: 100%; /* Full height (cover the whole page) */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5); /* Black background with opacity */
  z-index: 9999999; /* Specify a stack order in case you're using a different order for other elements */
}
.loading {
  width: 160px;
  height: 160px;
  border-radius: 150px;
  border: 15px solid #fff;
  border-top-color: rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
  position: absolute;
  top: 50%;
  left: 50%;
  margin-top: -80px;
  margin-left: -80px;
  animation: loading 1.2s linear infinite;
  -webkit-animation: loading 1.2s linear infinite;
  z-index: 9999;
}
@keyframes loading {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
@-webkit-keyframes loading {
  0% {
    -webkit-transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
  }
}

.overlay > img {
  position: relative;
  margin: 75px auto;
  display: block;
  animation: pulse 1.5s infinite ease-in-out;
  animation-fill-mode: both;
  &:before {
    content: '';
    position: absolute;
    border-style: solid;
    border-width: 0 40px 60px 40px;
    top: -40px;
    left: 10px;
  }
}

.overlay img {
  animation-delay: 0.25s;
}

@keyframes pulse {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
