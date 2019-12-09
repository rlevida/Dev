
export default function reducer(
    state = {
        Loading: false,
    },
    action
) {
    switch (action.type) {
        case "SET_SCREEN_LOADER": {
            return { ...state, Loading: action.Loading };
        }
        default:
            return state;
    }
}
