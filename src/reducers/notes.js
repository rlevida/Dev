import _ from "lodash";

export default function reducer(state = {
    Count: {},
    CountList: [],
    Filter: {
        title: ""
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
    NotesComponentCurrentPage: ""
}, action) {
    switch (action.type) {
        case "SET_NOTES_LIST": {
            return { ...state, List: action.list, ...(typeof action.count != "undefined") ? { Count: action.count } : {} }
        }
        case "SET_NOTES_COUNT_LIST": {
            return { ...state, CountList: action.list }
        }
        case "SET_STATUS_NOTES_COUNT_LIST": {
            return { ...state, StatusCount: action.count }
        }
        case "SET_NOTES_FORM_ACTIVE": {
            return { ...state, FormActive: action.FormActive }
        }
        case "SET_NOTES_SELECTED": {
            return { ...state, Selected: action.Selected }
        }
        case "SET_NOTES_ID": {
            return { ...state, SelectedId: action.SelectedId, Loading: "RETRIEVING" }
        }
        case "SET_NOTES_LOADING": {
            return { ...state, Loading: (typeof action.Loading != "undefined") ? action.Loading : "" }
        }
        case "SET_NOTES_MODAL_TYPE": {
            return { ...state, ModalType: action.ModalType }
        }
        case "UPDATE_DATA_NOTES_LIST": {
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
        case "DELETE_NOTES": {
            const { List } = { ...state };
            const copyOfList = [...List];
            const updatedList = _.remove(copyOfList, (listObj) => {
                return listObj.id != action.id;
            });

            return { ...state, List: updatedList }
        }
        case "SET_NOTES_STATUS": {
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
        case "SET_NOTES_FORM_ACTION": {
            return { ...state, FormAction: action.FormAction }
        }
        case "SET_NOTES_COMPONENT_CURRENT_PAGE": {
            return { ...state, NotesComponentCurrentPage: action.Page }
        }
        case "SET_NOTES_SELECT_LIST": {
            return { ...state, SelectList: action.List }
        }
        case "SET_NOTES_FILTER": {
            const { Filter } = { ...state };
            const updatedFilter = _.merge({}, Filter, action.filter);
            return { ...state, Filter: updatedFilter }
        }
        default:
            return state;
    }
}