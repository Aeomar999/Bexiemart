const fs = require('fs');
const path = require('path');
const stores = ['favorites-store.ts', 'wallet-store.ts', 'payment-store.ts', 'address-store.ts', 'food-cart-store.ts', 'services-store.ts', 'product-store.ts', 'rider-store.ts', 'reels-store.ts', 'popup-store.ts', 'socket-store.ts'];
const storesDir = path.join(process.cwd(), 'apps', 'mobile', 'src', 'lib', 'stores');

stores.forEach(store => {
  const filePath = path.join(storesDir, store);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${store} (does not exist)`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('zustand/middleware')) {
    content = content.replace(/import \{ create \} from ["']zustand["'];/, 'import { create } from "zustand";\nimport { persist, createJSONStorage } from "zustand/middleware";\nimport AsyncStorage from "@react-native-async-storage/async-storage";');
    
    // Some stores might have 'set, get' or just 'set'
    content = content.replace(/export const use([a-zA-Z]+) = create<([a-zA-Z]+)>\(\((set(?:, get)?(?:, api)?)\) => \(\{/, 'export const use$1 = create<$2>()(\n  persist(\n    ($3) => ({');
    
    // Add the persist config at the end
    const storeName = store.replace('.ts', '').replace('-store', ''); // 'address'
    content = content.replace(/\}\)\);(?:\s*)$/, '    }),\n    {\n      name: "' + storeName + '-storage",\n      storage: createJSONStorage(() => AsyncStorage),\n    }\n  )\n);');
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${store}`);
  }
});
console.log('Stores updated');
