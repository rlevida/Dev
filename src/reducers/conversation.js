export default function reducer(state = {
    Count: {},
    List: [],
    FormActive: "List",
    Selected: {},
    SelectedId: [],
    Filter: {},
    Loading: "RETRIEVING"
}, action) {
    switch (action.type) {
        case "ADD_COMMENT_LIST": {
            const { List } = { ...state };
            const updatedList = _.uniqBy(List.concat(action.list), "id");

            return { ...state, List: updatedList, ...(typeof action.count != "undefined") ? { Count: action.count } : {} }
        }
        case "SET_COMMENT_LIST": {
            return { ...state, List: action.list, ...(typeof action.count != "undefined") ? { Count: action.count } : {} }
        }
        case "SET_COMMENT_FORM_ACTIVE": {
            return { ...state, FormActive: action.FormActive }
        }
        case "SET_COMMENT_SELECTED": {
            return { ...state, Selected: action.Selected }
        }
        case "SET_COMMENT_ID": {
            return { ...state, SelectedId: action.SelectedId }
        }
        case "SET_COMMENT_STATUS": {
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
        case "SET_COMMENT_FILTER": {
            const { Filter } = { ...state };
            const updatedFilter = _.merge({}, _.omit(Filter, action.name), action.filter);
            return { ...state, Filter: updatedFilter }
        }
        //UPDATE
        case "UPDATE_COMMENT_LIST": {
            const { List } = { ...state };
            List.unshift(action.comment);
            return { ...state, List }
        }
        //REMOVE
        case "REMOVE_DELETED_COMMENT_LIST": {
            let tempList = [];
            action.list.map((e, i) => {
                if (action.id != e.id) {
                    tempList.push(e)
                }
            })
            return { ...state, List: tempList }
        }
        case "SET_COMMENT_LOADING": {
            return { ...state, Loading: (typeof action.Loading != "undefined") ? action.Loading : "" }
        }
        case "CLEAR_COMMENT": {
            return { ...state, List: [], Count: {} }
        }
        default:
            return state;
    }
}