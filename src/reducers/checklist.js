import _ from "lodash";

export default function reducer(state = {
    List: [],
    FormActive: "List",
    Selected: {},
    SelectedId: [],
    Loading: true,
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
        case "DELETE_CHECKLIST": {
            const { List } = { ...state };
            const updatedList = _.remove(List, checklist => checklist.id != action.data.id);
            console.log(updatedList)
            return { ...state, List: updatedList };
        }
        // case "SET_MEMBERS_FORM_ACTIVE": {
        //     return { ...state, FormActive: action.FormActive }
        // }
        // case "SET_MEMBERS_ID": {
        //     return { ...state, SelectedId: action.SelectedId }
        // }
        // case "UPDATE_DATA_MEMBERS_LIST": {
        //     let tempList = action.List.map((e, i) => {
        //         if (e.id == action.UpdatedData.id) {
        //             return action.UpdatedData
        //         }
        //         return e
        //     })
        //     return { ...state, List: tempList, Loading: false }
        // }
        // case "REMOVE_DELETED_MEMBERS_LIST": {
        //     const { List } = { ...state };
        //     const updatedTest = _.filter(List, (o) => {
        //         return o.userTypeLinkId != action.id
        //     });
        //     return { ...state, List: updatedTest }
        // }
        // case "SET_MEMBERS_STATUS": {
        //     let List = state.List.map((e, i) => {
        //         if (e.id == action.record.id) {
        //             e.Active = action.record.status
        //             return e
        //         } else {
        //             return e
        //         }
        //     })
        //     return { ...state, List: List }
        // }
        // case "SET_FORM_MEMBERS_LOADING": {
        //     return { ...state, Loading: action.Loading }
        // }
        default:
            return state;
    }
}