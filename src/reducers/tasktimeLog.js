import _ from "lodash";

export default function reducer(state = {
    List: [],
    FormActive: "List",
    Count: {},
    Selected: {
        total_hours: 0,
        description: "",
        type: 'hours'
    },
    TotalHours: [],
    Loading: "RETRIEVING",
}, action) {
    switch (action.type) {
        case "SET_TASKTIMELOG_LIST": {
            return { ...state, List: action.list, Count: action.count }
        }
        case "SET_TOTAL_HOURS": {
            return { ...state, TotalHours: action.total }
        }
        case "SET_TASKTIMELOG_SELECTED": {
            return { ...state, Selected: action.Selected }
        }
        case "SET_TASKTIMELOG_LOADING": {
            return { ...state, Loading: (typeof action.Loading != "undefined") ? action.Loading : "" }
        }
        case "UPDATE_TASKTIMELOG_LIST": {
            const { List } = { ...state };
            const updatedList = List.concat(action.list);

            return { ...state, List: updatedList, ...(typeof action.count != "undefined") ? { Count: action.count } : {} }
        }
        case "ADD_TASKTIMELOG_LIST": {
            const { List } = { ...state };
            const updatedList = (action.list).concat(List);

            return { ...state, List: updatedList }
        }
        default:
            return state;
    }
}