export default function reducer(state = {
    List: [],
    CountList: [],
    AllCountList: [],
    FormActive: "List",
    Selected: {
        isActive: true
    },
    SelectedId: [],
    FormAction : "",
    Loading : true
}, action) {
    switch (action.type) {
        case "SET_TASK_LIST": {
            return { ...state, List: action.list , Loading : false }
        }
        case "SET_TASK_COUNT_LIST": {
            return { ...state, CountList: action.list }
        }
        case "SET_ALL_TASK_COUNT_LIST": {
            return { ...state, AllCountList: action.list }
        }
        case "SET_TASK_FORM_ACTIVE": {
            return { ...state, FormActive: action.FormActive , FormAction : action.FormAction }
        }
        case "SET_TASK_SELECTED": {
            return { ...state, Selected: action.Selected }
        }
        case "SET_TASK_ID": {
            return { ...state, SelectedId: action.SelectedId }
        }
        case "UPDATE_DATA_TASK_LIST": {
            let tempList = action.List.map((e, i) => {
                if (e.id == action.UpdatedData.id) {
                    return action.UpdatedData
                }
                return e
            })
            return { ...state, List: tempList }
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
        default:
            return state;
    }
}