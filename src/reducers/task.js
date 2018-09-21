import _ from "lodash";

export default function reducer(state = {
    List: [],
    CountList: [],
    AllCountList: [],
    FormActive: "List",
    Selected: {
        isActive: true
    },
    SelectedId: [],
    FormAction: "",
    Loading: true,
    ModalType : ""
}, action) {
    switch (action.type) {
        case "SET_TASK_LIST": {
            return { ...state, List: action.list, Loading: false }
        }
        case "SET_TASK_COUNT_LIST": {
            return { ...state, CountList: action.list }
        }
        case "SET_ALL_TASK_COUNT_LIST": {
            return { ...state, AllCountList: action.list }
        }
        case "SET_TASK_FORM_ACTIVE": {
            return { ...state, FormActive: action.FormActive, FormAction: action.FormAction }
        }
        case "SET_TASK_SELECTED": {
            return { ...state, Selected: action.Selected }
        }
        case "SET_TASK_ID": {
            return { ...state, SelectedId: action.SelectedId }
        }
        case "SET_TASK_LOADING": {
            return { ...state, Loading: !state.Loading }
        }
        case "SET_MODAL_TYPE" :{
            return { ...state, ModalType: action.ModalType }
        }
        case "UPDATE_DATA_TASK_LIST": {
            const { List } = { ...state };
            const index = _.findIndex(List, { id: action.data.id });

            if (index >= 0) {
                List.splice(index, 1, action.data);
            } else {
                List.push(action.data)
            }
            return { ...state, List }
        }
        case "REMOVE_DELETED_TASK_LIST": {
            let tempList = [];
            action.List.map((e, i) => {
                if (action.id != e.id) {
                    tempList.push(e)
                }
            })
            return { ...state, List: tempList }
        }
        case "SET_TASK_STATUS": {
            let List = state.List.map((e, i) => {
                if (e.id == action.record.id) {
                    e.Active = action.record.status
                    return e
                } else {
                    return e
                }
            })
            return { ...state, List: List }
        }
        case "UPDATE_TASK_STATUS": {
            let currentTask = { ...state.Selected };
            let currentTaskDependencies = currentTask.dependencies;
            let updatedTaskDependencies = currentTaskDependencies.concat(action.data);
            let updatedSelected = { ...currentTask, dependencies: updatedTaskDependencies, dependencyType: "", linkTaskIds: [] };

            return { ...state, Selected: updatedSelected };
        }
        default:
            return state;
    }
}