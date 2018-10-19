import _ from "lodash";

export default function reducer(state = {
    List: [],
    FormActive: "List",
    Selected: {},
    SelectedId: [],
    Count: {}
}, action) {
    switch (action.type) {
        case "SET_ACTIVITYLOG_LIST": {
            return { ...state, List: action.list, Count: action.count }
        }
        case "UPDATE_ACTIVITYLOG_LIST": {
            const { List } = { ...state };
            const updatedList = List.concat(action.list);

            return { ...state, List: updatedList, Count: action.count }
        }
        default:
            return state;
    }
}