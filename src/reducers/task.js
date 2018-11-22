import _ from "lodash";

export default function reducer(state = {
    Count: {},
    CountList: [],
    Filter: {
        taskStatus: "",
        dueDate: "",
        taskAssigned: ""
    },
    FormActive: "List",
    FormAction: "",
    List: [],
    Loading: "RETRIEVING",
    ModalType: "",
    StatusCount: {},
    Selected: {
        isActive: true
    },
    SelectedId: [],
    SelectList: [],
    TaskComponentCurrentPage: ""
}, action) {
    switch (action.type) {
        case "SET_TASK_LIST": {
            return { ...state, List: action.list, ...(typeof action.count != "undefined") ? { Count: action.count } : {}, Selected: { isActive: true } }
        }
        case "SET_TASK_COUNT_LIST": {
            return { ...state, CountList: action.list }
        }
        case "SET_STATUS_TASK_COUNT_LIST": {
            return { ...state, StatusCount: action.count }
        }
        case "SET_TASK_FORM_ACTIVE": {
            return { ...state, FormActive: action.FormActive }
        }
        case "SET_TASK_SELECTED": {
            return { ...state, Selected: action.Selected }
        }
        case "SET_TASK_ID": {
            return { ...state, SelectedId: action.SelectedId, Loading: "RETRIEVING" }
        }
        case "SET_TASK_LOADING": {
            return { ...state, Loading: (typeof action.Loading != "undefined") ? action.Loading : "" }
        }
        case "SET_TASK_MODAL_TYPE": {
            return { ...state, ModalType: action.ModalType }
        }
        case "UPDATE_DATA_TASK_LIST": {
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
        case "DELETE_TASK": {
            const { List } = { ...state };
            const copyOfList = [...List];
            const updatedList = _.remove(copyOfList, (listObj) => {
                return listObj.id != action.id;
            });

            return { ...state, List: updatedList }
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
        case "SET_TASK_FORM_ACTION": {
            return { ...state, FormAction: action.FormAction }
        }
        case "SET_TASK_COMPONENT_CURRENT_PAGE": {
            return { ...state, TaskComponentCurrentPage: action.Page }
        }
        case "SET_TASK_SELECT_LIST": {
            return { ...state, SelectList: action.List }
        }
        case "SET_TASK_FILTER": {
            const { Filter } = { ...state };
            const updatedFilter = _.assign({}, Filter, action.filter);
            return { ...state, Filter: updatedFilter }
        }
        default:
            return state;
    }
}