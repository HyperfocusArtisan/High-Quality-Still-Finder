
<template>
  <div id="app" class="m-auto text-center p-8 max-w-[45rem]">
    <h1 class="text-2xl font-bold mb-4 ">💖 Hello World!</h1>
    <p class="mb-4">Welcome to your Electron application.</p>
    <UButton label="Open Folder" @click="openFolder" class="text-center m-2.5 py-2.5 px-5 text-base cursor-pointer rounded transition-colors duration-300 ease-in-out mb-2" />
    <UButton label="Open File" @click="openFile" id="openFileDialogButton" class="text-center m-2.5 py-2.5 px-5 text-base cursor-pointer rounded transition-colors duration-300 ease-in-out mb-4" />
    <div v-if="selectedFolder" class="mb-4">Found {{ imagecount }} Images</div>
    <div v-if="selectedFile" class="mb-4">Found {{ imagecount }} Images</div>
    <UCard>
      <div class="flex flex-row text-center m-auto p-4 h-12 mb-6">
        <p class="mb-2 m-auto">Choose your IQA-Model</p>
        <USelect v-model="model" :options="models" option-attribute="name" v-auto-animate class="text-center m-auto py-2.5 px-5 text-base cursor-pointer rounded transition-colors duration-300 ease-in-out mb-2" />
        <UButton label="Rate Images" @click="triggerIqa" class="text-center m-auto py-2.5 px-5 text-base cursor-pointer rounded transition-colors duration-300 ease-in-out" />
      </div>
    </UCard>

    <!-- <UCarousel v-slot="{ item }" :items="items" :ui="{ item: 'basis-full' }" class="text-center m-2.5 py-2.5 px-5 text-base cursor-pointer rounded transition-colors duration-300 ease-in-out overflow-hidden mb-4" arrows>
      <img :src="item" class="w-full" draggable="true" @click="openImage($event)">
    </UCarousel> -->

    <div v-if="items.length > 1" class="grid grid-cols-2 md:grid-cols-3 gap-2 grid-rows-1">
      <div v-for="(item, index) in items" :key="index" class="overflow-hidden">
        <img :src="item" class="hover:scale-105 w-[100%] h-auto cursor-pointer ease-in-out" @click="openImage($event)">
      </div>
    </div>
    <div v-else>
      <img v-for="(item, index) in items" :key="index" :src="item" class="hover:scale-105 w-[100%] h-auto cursor-pointer ease-in-out" @click="openImage($event)">
    </div>

    <div class="flex flex-row justify-between m-auto p-[2rem]">
      <p class="mb-2">Set your desired Level of Quality</p>
      <div class="flex flex-col justify-between min-w-[200px]">
        <URange size="md" :min="0" :max="1" :step="0.05" v-model="sliderValue" :sliderValue="0.6" v-auto-animate class="text-center m-2.5 py-2.5 px-5 text-base cursor-pointer rounded transition-colors duration-300 ease-in-out mb-2" />
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
        <div class="flex justify-center align-top h-[100vh] p-[10]">
          <img :src="selectedImageSrc" class=" max-w-[100%] max-h-[75vh] block">
        </div>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                Image-Name: {{ selectedImageSrc.name }}
              </h3>
              <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isImageViewerOpen = false" />
            </div>
          </template>
        </UCard>
      </UModal>
    </div>


  </div>
</template>

<script>
import axios from 'axios';
import Papa from 'papaparse';
import { Parser } from '@json2csv/plainjs';


const models = [{
  name: 'clipiqa',
  value: 'clipiqa'
}, {
  name: 'clipiqa+',
  value: 'clipiqa+'
}, {
  name: 'clipiqa+_vitL14_512',
  value: 'clipiqa+_vitL14_512'
}, {
  name: 'qalign',
  value: 'qalign'
}, {
  name: 'brisque',
  value: 'brisque'
}, {
  name: 'fid',
  value: 'fid'
}, {
  name: 'topiq_iaa',
  value: 'topiq_iaa'
}, {
  name: 'nima',
  value: 'nima'
}
]

export default {
  data() {
    return {
      items: [
        'https://placehold.co/600x300?text=Rated+Images+Shown+Here',
      ],
      sliderValue: 0.5,
      selectedFolder: null,
      selectedFile: null,
      csvPath: null,
      basePath: null,
      model: 'clipiqa', // Define model here
      models: models, // Make models available in the template
      isImageViewerOpen: false,
      selectedImageSrc: '',
      image_files_results: [],
      imagecount: 0,
      filteredImages: [],
      imagePath: '',
      index: 1,
    };
  },
  watch: {
    sliderValue(newVal, oldVal) {
      console.log(`Slider value changed from ${oldVal} to ${newVal}`);
      this.filterImagesByScore();
    }
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
      const filePaths = await window.electron.invoke('open-file-dialog');
      if (filePaths) {
        this.selectedFile = filePaths[0];
        console.log(`Selected file: ${this.selectedFile}`);
        // Implement the logic to handle the selected file path here...
      }
    },
    async openFolder() {
      const result = await window.electron.invoke('select-folder');
      if (result) {
        this.selectedFolder = result.folderPath;
        this.imagecount = result.imageCount;
        console.log(`Found ${this.imagecount} images`);
        console.log(`Selected folder: ${this.selectedFolder}`);
      } else {
        console.log('No folder selected');
      }
    },
    modelChanged() {
      console.log(`Now using ${this.model} model for scoring`);
    },
    sliderChanged() {
      console.log(`Slider changed to ${this.sliderValue}%`);
    },
    triggerIqa() {
      axios.post('http://localhost:5000/iqa', {
        directory_path: this.selectedFolder,
        model: this.model
      })
      .then(response => {
        console.log(response.data.message);
        this.csvPath = response.data.csv_path;
        this.filterImagesByScore();
      })
      .catch(error => {
        console.error("There was an error!", error);
      });
    },
    async filterImagesByScore() {
      if (!this.csvPath) {
        console.error("CSV path is not set.");
        return;
      }

      console.log("CSV Path:", this.csvPath);

      // Set the base path for the images
      const basePath_Data = await window.electron.invoke('set-base-path', this.csvPath);
      this.basePath = basePath_Data.basePath;

      const result = await window.electron.invoke('read-csv', this.csvPath);

      if (!result.success) {
        console.error("Error reading CSV file:", result.error);
        return;
      }

      console.log("Raw CSV Data:", result.data);

      // Process the parsed data
      const processedData = result.data.map(row => {
        const [filename, score] = row;
        return { filename, score };
      });

      console.log("Processed Data:", processedData);

      // Convert JSON array to CSV string
      let csvString;
      try {
        if (!processedData || processedData.length === 0) {
          throw new Error("No data available to convert to CSV.");
        }
        const opts = { fields: Object.keys(processedData[0]) };
        const parser = new Parser(opts);
        csvString = parser.parse(processedData);
      } catch (error) {
        console.error("Error converting JSON to CSV:", error);
        return;
      }

      Papa.parse(csvString, {
        header: true, // Assuming the CSV has headers
        complete: (results) => {
          console.log("Parsed CSV Results:", results.data);
          const filteredImages = results.data
            .filter(row => {
              const score = parseFloat(row.score);
              console.log(`Row: ${JSON.stringify(row)}, Score: ${score}, Slider Value: ${this.sliderValue}`);
              return score >= this.sliderValue;
            }) // Adjust based on your CSV structure
            .map(row => {
              const imagePath = `file://${this.basePath}/${row.filename}`;
              this.imagePath = imagePath;
              console.log(`Image Path: ${imagePath}`);
              return imagePath;
            }); // Adjust based on your CSV structure
          console.log("Filtered Images:", filteredImages);
          this.items = []; // Clear the items array
          // Add all images to items[]
          filteredImages.forEach(imagePath => {
            this.addImage(imagePath);
          });
          // Use Vue's set method to ensure reactivity
          this.filteredImages = filteredImages;
        },
        error: (error) => {
          console.error("Error parsing CSV:", error);
        }
      });
    },
    addImage(imagePath) {
      this.items.push(imagePath); // Add the image to the array
      console.log("Items:", this.items);
    }
  },
  components: {
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica,
    Arial, sans-serif;
};
</style>