import _ from "lodash";

export default function reducer(state = {
    List: [],
    Loading: "",
    Selected: {}
}, action) {
    switch (action.type) {
        case "SET_TASK_DEPENDENCY_LIST": {
            return { ...state, List: action.List, Loading: "", Selected: {} }
        }
        case "UPDATE_DATA_TASK_DEPENDENCY_LIST": {
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

            return { ...state, List: copyOfList, ...(typeof action.Count != "undefined") ? { Count: action.Count } : {} }
        }
        case "DELETE_TASK_DEPENDENCY": {
            const { List } = { ...state };
            const copyOfList = [...List];
            const updatedList = _.remove(copyOfList, (listObj) => {
                return listObj.id != action.id;
            });

            return { ...state, List: updatedList }
        }
        case "SET_TASK_DEPENDENCY_SELECTED": {
            return { ...state, Selected: action.Selected }
        }
        default:
            return state;
    }
}