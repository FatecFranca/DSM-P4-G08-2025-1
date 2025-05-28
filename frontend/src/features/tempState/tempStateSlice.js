const initialState = {
  openGraphCount: 0
}

export default function tempStateReducer(state = initialState, action) {
  switch (action.type) {
    case 'tempState/updateOpenGraphCount': {
      return {
        ...state,
        openGraphCount: action.payload
      }
    }
    case 'tempState/reset': {
      return initialState;
    }
    default:
      return state
  }
}
