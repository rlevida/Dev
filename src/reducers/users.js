export default function reducer(state = {
    List: [],
    FormActive: "List",
    Selected: {},
    SelectedId: [],
    Trainer: [],
    Count: {},
    Loading: 'RETRIEVING',
    CurrentData: {}
}, action) {
    switch (action.type) {
        case "ADD_USER_LIST": {
            return { ...state, List: state.List.concat(action.List) }
        }
        case "SET_USER_LIST": {
            return { ...state, List: action.List, Count: action.Count }
        }
        case "SET_TRAINER_LIST": {
            return { ...state, Trainer: action.list }
        }
        case "SET_USER_FORM_ACTIVE": {
            return { ...state, FormActive: action.FormActive }
        }
        case "SET_USER_SELECTED": {
            return { ...state, Selected: action.Selected }
        }
        case "SET_USER_ID": {
            return { ...state, SelectedId: action.SelectedId }
        }
        case "SET_CURRENT_DATA_SELECTED": {
            return { ...state, CurrentData: action.Selected }
        }
        case "UPDATE_DATA_USER_LIST": {
            let tempList = state.List.map((e, i) => {
                if (e.id == action.UpdatedData.id) {
                    return action.UpdatedData
                }
                return e
            })
            return { ...state, List: tempList }
        }
        case "REMOVE_DELETED_USER_LIST": {
            let tempList = state.List.filter((e, i) => {
                if (action.Id != e.id) {
                    return e;
                }
            })
            return { ...state, List: tempList }
        }
        case "SET_USER_STATUS": {
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
        case "SET_USER_LOADING": {
            return { ...state, Loading: action.Loading }
        }
        default:
            return state;
    }
}