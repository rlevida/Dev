import _ from "lodash";

export default function reducer(
    state = {
        List: [],
        Selected: {},
        Count: {},
        Filter: {
            isArchived: 0,
            isDeleted: 0
        },
        NotificationCount: 0,
        Loading: "RETRIEVING"
    },
    action
) {
    switch (action.type) {
        case "SET_NOTIFICATION_LIST": {
            return { ...state, List: state.List.concat(action.list), ...(action.count ? { Count: action.count } : {}) };
        }
        case "SET_NOTIFICATION_SELECTED": {
            return { ...state, Selected: action.Selected };
        }
        case "SET_NOTIFICATION_FILTER": {
            return { ...state, Filter: action.Filter };
        }
        case "UPDATE_DATA_NOTIFICATION_LIST": {
            let newList = state.List.map((e, i) => {
                if (e.id == action.updatedData.id) {
                    return action.updatedData;
                }
                return e;
            });
            return { ...state, List: newList };
        }
        case "SET_NOTIFICATION_COUNT": {
            return { ...state, NotificationCount: action.Count };
        }
        case "SET_NOTIFICATION_LOADING": {
            return { ...state, Loading: action.loading };
        }
        case "REMOVE_NOTIFICATION_FROM_LIST": {
            const tempList = state.List.filter(e => {
                return e.id !== action.id;
            });
            return { ...state, List: tempList };
        }
        default:
            return state;
    }
}
