import _ from "lodash";

export default function reducer(state = {
    Count: {},
    CountList: [],
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
            return { ...state, List: action.list, Count: action.count, Selected: { isActive: true } }
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

            // const updateIndex = _.findIndex(copyOfList, { id: action.data.id });
            // copyOfList.splice(updateIndex, 1, action.data);

            // // let updatedList = [];

            // // if (action.data.action == "add") {
            // //     updatedList = copyOfList.concat(action.data.data);
            // // } else {
            // //     _.map(action.data.data, (o) => {
            // //         var updateIndex = _.findIndex(copyOfList, { id: o.id });
            // //         if (updateIndex >= 0) {
            // //             copyOfList.splice(updateIndex, 1, o);
            // //         } else {
            // //             copyOfList.push(o);
            // //         }
            // //     })

            // //     updatedList = copyOfList;

            // //     // Deactivating a task disables creation of new instances
            // //     var dataIndex = _.findIndex(List, { id: action.data.data[0].id });
            // //     if (List[dataIndex].isActive != action.data.data[0].isActive) {
            // //         _.map(updatedList, (o) => {
            // //             if (o.periodTask == action.data.data[0].id) {
            // //                 o.isActive = action.data.data[0].isActive
            // //             }
            // //         })
            // //     }
            // // }

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
        default:
            return state;
    }
}