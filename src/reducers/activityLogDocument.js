import _ from "lodash";

export default function reducer(state = {
    List: [],
    FormActive: "List",
    Selected: {},
    SelectedId: [],
    Count: {}
}, action) {
    switch (action.type) {
        case "ADD_ACTIVITYLOG_DOCUMENT": {
            const { List } = { ...state };
            List.unshift(action.activity_log);
            return { ...state, List }
        }
        case "SET_ACTIVITYLOG_DOCUMENT_LIST": {
            return { ...state, List: action.list, ...(typeof action.count != "undefined") ? { Count: action.count } : {} }
        }
        case "UPDATE_ACTIVITYLOG_DOCUMENT_LIST": {
            const { List } = { ...state };
            const updatedList = List.concat(action.list);

            return { ...state, List: updatedList, ...(typeof action.count != "undefined") ? { Count: action.count } : {} }
        }
        default:
            return state;
    }
}