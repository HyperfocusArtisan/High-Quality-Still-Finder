// Import the necessary Electron modules
import { contextBridge, ipcRenderer } from 'electron';

// Expose a safe API to the renderer process
contextBridge.exposeInMainWorld(
  'electron',
  // This is the name the renderer will use to access the API, e.g., window.api
  {
    // Method to send messages
    send: (channel: string, data: any) => ipcRenderer.send(channel, data),
    invoke: (channel: string, data: any) => ipcRenderer.invoke(channel, data),
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