const initialState = {
  rawSensorData: null,
  filteredSensorData: [],
  openGraphCount: 0,
  orangeStatusMins: 10,
  redStatusMins: 20,
}

export default function appStateReducer(state = initialState, action) {
  switch (action.type) {
    case 'appState/setRawSensorData': {
      return {
        ...state,
        rawSensorData: action.payload
      }
    }
    case 'appState/resetRawSensorData': {
      return {
        ...state,
        rawSensorData: initialState.rawSensorData
      }
    }
    case 'appState/setFilteredSensorData': {
      return {
        ...state,
        filteredSensorData: action.payload
      }
    }
    case 'appState/resetFilteredSensorData': {
      return {
        ...state,
        filteredSensorData: initialState.filteredSensorData
      }
    }
    case 'appState/setOrangeStatusMins': {
      return {
        ...state,
        orangeStatusMins: action.payload
      }
    }
    case 'appState/resetOrangeStatusMins': {
      return {
        ...state,
        orangeStatusMins: initialState.orangeStatusMins
      }
    }
    case 'appState/setRedStatusMins': {
      return {
        ...state,
        redStatusMins: action.payload
      }
    }
    case 'appState/resetRedStatusMins': {
      return {
        ...state,
        redStatusMins: initialState.redStatusMins
      }
    }
    case 'appState/updateOpenGraphCount': {
      return {
        ...state,
        openGraphCount: action.payload
      }
    }
    case 'appState/reset': {
      return initialState;
    }
    default:
      return state
  }
}
