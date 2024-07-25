
<template>
  <div id="app">
    <h1>💖 Hello World!</h1>
    <p>Welcome to your Electron application.</p>
    <UButton label="Open Folder" @click="openFolder" />
    <UButton label="Open File" @click="openFile" id="openFileDialogButton" />
    <div v-if="selectedFolder">Found {{ imagecount }} Images</div>
    <div v-if="selectedFile">Found {{ imagecount }} Images</div>
    <div class="row-container">
      <p>Choose your IQA-Model</p>
      <USelect v-model="model" :options="models" option-attribute="name" v-auto-animate/>
      <UButton label="Rate Images" @click="openFile" />
    </div>

    <UCarousel v-if="selectedFolder" v-slot="{ item }" :items="items" :ui="{ item: 'basis-full' }" class="rounded-lg overflow-hidden" arrows>
      <img :src="item" class="w-full" draggable="true" @click="openImage($event)">
    </UCarousel>

    <div class="row-container">
      <p>Set your desired Level of Quality</p>
      <div class="column-container">
        <URange size="md" :min="0" :max="1" :step="0.05" v-model="sliderValue" :sliderValue="0.6" v-auto-animate/>
        <p>Slider value: {{ sliderValue }}</p>
      </div>
    </div>
    

    <!-- <div v-if="isImageViewerOpen" class="image-viewer-modal" @click="closeImageViewer">
      <img :src="selectedImageSrc" class="image-viewer-content">
    </div> -->

    <div class="image-viewer-modal-container">
      <UModal v-model="isImageViewerOpen" fullscreen class="image-viewer-modal">
        <UCard
          :ui="{
            base: 'h-full flex flex-col',
            rounded: '',
            divide: 'divide-y divide-gray-100 dark:divide-gray-800',
            body: {
              base: 'grow'
            }
          }"
        >
        <div class="image-viewer-container">
          <img :src="selectedImageSrc" class="image-viewer-content">
        </div>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                Image-Name: {{ selectedImageSrc.name }}
              </h3>
              <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isImageViewerOpen = false" />
            </div>
            <NuxtPage />
</template>
        </UCard>
      </UModal>
    </div>
    
  </div>
</template>

<script>
import { ref } from 'vue';


const models = [{
  name: 'clipiqa',
  value: 'clipiqa'
}, {
  name: 'clipiqa+',
  value: 'clipiqa_plus'
}, {
  name: 'clipiqa+_vitL14_512',
  value: 'clipiqa_plus_vitL14_512'
}]

export default {
  data() {
    return {
      items: [
        'https://picsum.photos/1920/1080?random=1',
        'https://picsum.photos/1920/1080?random=2',
        'https://picsum.photos/1920/1080?random=3',
        'https://picsum.photos/1920/1080?random=4',
        'https://picsum.photos/1920/1080?random=5',
        'https://picsum.photos/1920/1080?random=6'
      ],
      sliderValue: 0.6,
      selectedFolder: '',
      selectedFile: null,
      model: 'clipiqa', // Define model here
      models: models, // Make models available in the template
      isImageViewerOpen: false,
      selectedImageSrc: '',
      image_files_results: [],
      imagecount: 0
    };
  },
  methods: {
    openImage(event) {
      this.selectedImageSrc = event.target.src; // Assuming the src attribute holds the image URL
      this.isImageViewerOpen = true;
    },
    closeImageViewer() {
      this.isImageViewerOpen = false;
    },
    
    async openFile() {
      const filePaths = await window.electron.send('open-file-dialog');
      if (filePaths.length > 0) {
        this.selectedFile = filePaths[0];
        console.log(`Selected file: ${this.selectedFile}`);
        // Implement the logic to handle the selected file path here...
      }
    },
    async openFolder() {
      const folderPaths = await window.electron.send('open-folder-dialog');
      if (folderPaths.length > 0) {
        this.selectedFolder = folderPaths[0];
        console.log(`Selected folder: ${this.selectedFolder}`);
        // Implement the logic to handle the selected folder path here...
      }
    },
    modelChanged() {
      console.log(`Now using ${this.model} model for scoring`);
    },
    sliderChanged() {
      console.log(`Slider changed to ${this.sliderValue}%`);
    },
  },
  components: {
  }
};
</script>

<style scoped>
  @import "index.css";
</style>
