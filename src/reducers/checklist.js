import _ from "lodash";

export default function reducer(state = {
    List: [],
    FormActive: "List",
    Selected: {},
    SelectedId: [],
    Loading: "RETRIEVING",
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
            const copyOfList = [...List];
            _.map(action.List, (o) => {
                const updateIndex = _.findIndex(copyOfList, { id: o.id });

                if (updateIndex >= 0) {
                    copyOfList.splice(updateIndex, 1, o);
                } else {
                    copyOfList.push(o);
                }
            });
            
            return { ...state, List: copyOfList, ...(typeof action.Count != "undefined") ? { Count: action.Count } : {}, Loading: "" }
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