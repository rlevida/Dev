import _ from "lodash";

export default function reducer(state = {
    List: [],
    FormActive: "List",
    Count: {},
    TotalHours: 0
}, action) {
    switch (action.type) {
        case "SET_TASKTIMELOG_LIST": {
            return { ...state, List: action.list }
        }
        case "SET_TOTAL_HOURS": {
            return { ...state, TotalHours: action.hours }
        }
        case "UPDATE_TASKTIMELOG_LIST": {
            const { List } = { ...state };
            const updatedList = List.concat(action.list);

            return { ...state, List: updatedList, ...(typeof action.count != "undefined") ? { Count: action.count } : {} }
        }
        default:
            return state;
    }
}