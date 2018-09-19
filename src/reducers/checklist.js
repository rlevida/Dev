import _ from "lodash";

export default function reducer(state = {
    List: [],
    FormActive: "List",
    Selected: {},
    SelectedId: [],
    Loading: true,
    Action: undefined
}, action) {
    switch (action.type) {
        case "SET_CHECKLIST": {
            return { ...state, List: action.list, Loading: false }
        }
        case "SET_CHECKLIST_ACTION": {
            return { ...state, Action: action.action }
        }
        case "SET_CHECKLIST_SELECTED": {
            return { ...state, Selected: action.Selected }
        }
        case "ADD_CHECKLIST": {
            const { List } = { ...state };
            List.push(action.data);

            return { ...state, List, Selected: {} };
        }
        case "UPDATE_CHECKLIST": {
            const { List } = { ...state };
            const index = _.findIndex(List, { id: action.data.id });

            if (index >= 0) {
                const updatedEl = _.merge({}, List[index], action.data);
                List.splice(index, 1, updatedEl);
            }
            return { ...state, List };
        }
        case "DELETE_CHECKLIST": {
            const { List } = { ...state };
            const updatedList = _.remove(List, checklist => checklist.id != action.data.id);
            return { ...state, List: updatedList };
        }
        default:
            return state;
    }
}