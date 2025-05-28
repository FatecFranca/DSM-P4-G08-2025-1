import { combineReducers } from 'redux'

import appStateReducer from './features/appState/appStateSlice'
import tempStateReducer from './features/tempState/tempStateSlice'

const rootReducer = combineReducers({
  appState: appStateReducer,
  tempState: tempStateReducer
})

export default rootReducer
