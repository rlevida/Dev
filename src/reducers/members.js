import _ from "lodash";

export default function reducer(state = {
    List: [],
    FormActive: "List",
    Selected: {},
    SelectedId: [],
    Loading: "RETRIEVING",
    Count: {}
}, action) {
    switch (action.type) {
        case "ADD_MEMBER_TO_LIST": {
            let List = state.List;
            action.list.map((e) => {
                List.push(e)
            })
            return { ...state, List: List }
        }
        case "SET_MEMBERS_LIST": {
            return { ...state, List: action.list, Count: action.count, Loading: '' }
        }
        case "SET_MEMBERS_FORM_ACTIVE": {
            return { ...state, FormActive: action.FormActive }
        }
        case "SET_MEMBERS_SELECTED": {
            return { ...state, Selected: action.Selected }
        }
        case "SET_MEMBERS_ID": {
            return { ...state, SelectedId: action.SelectedId }
        }
        case "SET_MEMBERS_LOADING": {
            return { ...state, Loading: action.Loading }
        }
        case "UPDATE_DATA_MEMBERS_LIST": {
            const { List } = { ...state };
            const copyOfList = [...List];

            _.map(action.list, (o) => {
                const updateIndex = _.findIndex(copyOfList, { id: o.id });

                if (updateIndex >= 0) {
                    copyOfList.splice(updateIndex, 1, o);
                } else {
                    copyOfList.push(o);
                }
            });

            return { ...state, List: copyOfList, ...(typeof action.Count != "undefined") ? { Count: action.Count } : {} }
        }
        case "REMOVE_DELETED_MEMBERS_LIST": {
            const { List } = { ...state };
            const updatedTest = _.filter(List, (o) => {
                return o.id != action.id
            });
            return { ...state, List: updatedTest }
        }
        case "SET_MEMBERS_STATUS": {
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
        case "DELETE_MEMBER_FROM_LIST": {
            const { List } = { ...state };
            const updatedList = _.filter(List, (o) => {
                return o.user.id != action.id
            });
            return { ...state, List: updatedList }
        }
        default:
            return state;
    }
}