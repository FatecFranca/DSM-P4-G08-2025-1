import { configureStore } from "@reduxjs/toolkit";
import rootReducer from './reducer';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const persistConfig = { 
  key: 'root',
  storage,
  blacklist: ['tempState']
}

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({reducer: persistedReducer});

export const persistor = persistStore(store)

