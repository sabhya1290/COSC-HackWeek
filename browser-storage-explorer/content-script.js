// content-script.js - Injected into the web page to interact with LocalStorage, SessionStorage, and IndexedDB.

// Message handler
window.addEventListener('message', function(event) {
  // We can also communicate with the page if needed, but chrome.runtime.onMessage is standard.
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    switch (request.action) {
      case 'GET_STORAGE_DATA':
        sendResponse({
          success: true,
          localStorage: getAllLocalStorage(),
          sessionStorage: getAllSessionStorage()
        });
        break;

      case 'SET_STORAGE_ITEM':
        if (request.type === 'localStorage') {
          window.localStorage.setItem(request.key, request.value);
        } else {
          window.sessionStorage.setItem(request.key, request.value);
        }
        sendResponse({ success: true });
        break;

      case 'DELETE_STORAGE_ITEM':
        if (request.type === 'localStorage') {
          window.localStorage.removeItem(request.key);
        } else {
          window.sessionStorage.removeItem(request.key);
        }
        sendResponse({ success: true });
        break;

      case 'CLEAR_STORAGE':
        if (request.type === 'localStorage') {
          window.localStorage.clear();
        } else {
          window.sessionStorage.clear();
        }
        sendResponse({ success: true });
        break;

      case 'GET_INDEXEDDB_DATA':
        getIndexedDBData().then(data => {
          sendResponse({ success: true, databases: data });
        }).catch(err => {
          sendResponse({ success: false, error: err.message });
        });
        return true; // async response

      case 'DELETE_INDEXEDDB_DATABASE':
        deleteIndexedDBDatabase(request.dbName).then(() => {
          sendResponse({ success: true });
        }).catch(err => {
          sendResponse({ success: false, error: err.message });
        });
        return true; // async response

      case 'CLEAR_INDEXEDDB_STORE':
        clearIndexedDBStore(request.dbName, request.storeName).then(() => {
          sendResponse({ success: true });
        }).catch(err => {
          sendResponse({ success: false, error: err.message });
        });
        return true; // async response

      case 'DELETE_INDEXEDDB_ITEM':
        deleteIndexedDBItem(request.dbName, request.storeName, request.key).then(() => {
          sendResponse({ success: true });
        }).catch(err => {
          sendResponse({ success: false, error: err.message });
        });
        return true; // async response

      case 'SET_INDEXEDDB_ITEM':
        setIndexedDBItem(request.dbName, request.storeName, request.key, request.value).then(() => {
          sendResponse({ success: true });
        }).catch(err => {
          sendResponse({ success: false, error: err.message });
        });
        return true; // async response

      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (e) {
    sendResponse({ success: false, error: e.toString() });
  }
});

// Helper: Get LocalStorage details
function getAllLocalStorage() {
  const items = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    const value = window.localStorage.getItem(key);
    items.push({
      key: key,
      value: value,
      size: (key.length + value.length) * 2 // approx in bytes
    });
  }
  return items;
}

// Helper: Get SessionStorage details
function getAllSessionStorage() {
  const items = [];
  for (let i = 0; i < window.sessionStorage.length; i++) {
    const key = window.sessionStorage.key(i);
    const value = window.sessionStorage.getItem(key);
    items.push({
      key: key,
      value: value,
      size: (key.length + value.length) * 2 // approx in bytes
    });
  }
  return items;
}

// Helper: Get all IndexedDB databases, stores, and values
async function getIndexedDBData() {
  if (!window.indexedDB || !window.indexedDB.databases) {
    return [];
  }
  const dbs = await window.indexedDB.databases();
  const dbPromises = dbs.map(dbInfo => {
    return new Promise((resolve) => {
      const openRequest = window.indexedDB.open(dbInfo.name, dbInfo.version);
      openRequest.onsuccess = async (event) => {
        const db = event.target.result;
        const storeNames = Array.from(db.objectStoreNames);
        const storesData = [];

        for (const storeName of storeNames) {
          try {
            const storeData = await readObjectStore(db, storeName);
            storesData.push({
              name: storeName,
              items: storeData
            });
          } catch (e) {
            console.error("Failed to read store:", storeName, e);
          }
        }
        db.close();
        resolve({
          name: dbInfo.name,
          version: dbInfo.version,
          stores: storesData
        });
      };
      openRequest.onerror = () => {
        resolve({
          name: dbInfo.name,
          version: dbInfo.version,
          stores: [],
          error: "Could not open database"
        });
      };
    });
  });

  return Promise.all(dbPromises);
}

function readObjectStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.openCursor();
    const items = [];

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        let serializedVal;
        try {
          serializedVal = typeof cursor.value === 'object' ? JSON.stringify(cursor.value) : String(cursor.value);
        } catch (e) {
          serializedVal = "[Unserializable Object]";
        }
        
        let keyStr;
        try {
          keyStr = typeof cursor.key === 'object' ? JSON.stringify(cursor.key) : String(cursor.key);
        } catch (e) {
          keyStr = String(cursor.key);
        }

        items.push({
          key: keyStr,
          value: serializedVal,
          rawKey: cursor.key,
          rawValue: cursor.value,
          size: (keyStr.length + serializedVal.length) * 2
        });
        cursor.continue();
      } else {
        resolve(items);
      }
    };

    request.onerror = () => reject(transaction.error);
  });
}

function deleteIndexedDBDatabase(dbName) {
  return new Promise((resolve, reject) => {
    const req = window.indexedDB.deleteDatabase(dbName);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function clearIndexedDBStore(dbName, storeName) {
  return new Promise((resolve, reject) => {
    // We need to increment the version or open DB and run transaction
    // Opening DB is enough to clear/delete a store
    const openRequest = window.indexedDB.open(dbName);
    openRequest.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => {
        db.close();
        resolve();
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    };
    openRequest.onerror = () => reject(openRequest.error);
  });
}

function deleteIndexedDBItem(dbName, storeName, key) {
  return new Promise((resolve, reject) => {
    const openRequest = window.indexedDB.open(dbName);
    openRequest.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Parse key back from string if needed
      let parsedKey = key;
      try {
        parsedKey = JSON.parse(key);
      } catch (e) {}

      const req = store.delete(parsedKey);
      req.onsuccess = () => {
        db.close();
        resolve();
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    };
    openRequest.onerror = () => reject(openRequest.error);
  });
}

function setIndexedDBItem(dbName, storeName, key, value) {
  return new Promise((resolve, reject) => {
    const openRequest = window.indexedDB.open(dbName);
    openRequest.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      let parsedKey = key;
      try {
        parsedKey = JSON.parse(key);
      } catch (e) {}

      let parsedValue = value;
      try {
        parsedValue = JSON.parse(value);
      } catch (e) {}

      const req = store.put(parsedValue, parsedKey);
      req.onsuccess = () => {
        db.close();
        resolve();
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    };
    openRequest.onerror = () => reject(openRequest.error);
  });
}
