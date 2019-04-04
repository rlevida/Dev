import _ from "lodash";

export default function reducer(state = {
    List: [],
    Selected: {},
    Filter: {
        status: 'active'
    },
    Loading: "RETRIEVING"
}, action) {
    switch (action.type) {
        case "SET_NOTIFICATION_LIST": {
            return { ...state, List: action.List }
        }
        case "SET_NOTIFICATION_SELECTED": {
            return { ...state, Selected: action.Selected }
        }
        case "SET_NOTIFICATION_FILTER": {
            return { ...state, Filter: action.Filter }
        }
        case "UPDATE_DATA_NOTIFICATION_LIST": {
            let newList = state.List.map((e, i) => {
                if (e.id == action.UpdatedData.id) {
                    return action.UpdatedData
                }
                return e
            })
            return { ...state, List: newList }
        }
        default:
            return state;
    }
}