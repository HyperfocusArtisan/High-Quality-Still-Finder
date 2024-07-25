// Import the necessary Electron modules
import { contextBridge, ipcRenderer } from 'electron';

// Expose a safe API to the renderer process
contextBridge.exposeInMainWorld(
  'electron',
  // This is the name the renderer will use to access the API, e.g., window.api
  {
    // Method to send messages
    send: (channel: string, data: any) => ipcRenderer.invoke(channel, data),
    // Method to invoke methods and expect a response
    invoke: (channel: string, data: any) => { // Add an 'invoke' method for channels that expect a return value
      // List of allowed channels for invoke
      const validChannels = ['open-file-dialog']; // Specify 'open-file-dialog' as a valid channel for invoke
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, data); // Use ipcRenderer.invoke for channels that expect a response
      }
    },
    // Method to receive messages
    receive: (channel: string, func: (...args: any[]) => void) => { // Explicitly define the type of 'channel' as string and 'func' as a function accepting any number of arguments of any type
      const validChannels = ['fromMain'];
      if (validChannels.includes(channel)) {
        // Remove any existing listeners before adding a new one
        ipcRenderer.removeAllListeners(channel);
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    }
  }
);