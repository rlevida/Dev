import _ from "lodash";

export default function reducer(state = {
    List: [],
    FormActive: "List",
    Selected: {},
    SelectedId: [],
    Trainer: []
}, action) {
    switch (action.type) {
        case "SET_TEAM_LIST": {
            return { ...state, List: action.list }
        }
        case "SET_TEAM_FORM_ACTIVE": {
            return { ...state, FormActive: action.FormActive }
        }
        case "SET_TEAM_SELECTED": {
            return { ...state, Selected: action.Selected }
        }
        case "SET_TEAM_ID": {
            return { ...state, SelectedId: action.SelectedId }
        }
        case "UPDATE_DATA_TEAM_LIST": {
            let { List } = { ...state };
            let indexToBeUpdated = _.findIndex(List, (o) => {return o.id == action.List.id});
            List[indexToBeUpdated] = action.List;
            return { ...state, List: List }
        }
        case "REMOVE_DELETED_TEAM_LIST": {
            let tempList = [];
            action.List.map((e, i) => {
                if (action.id != e.id) {
                    tempList.push(e)
                }
            })
            return { ...state, List: tempList }
        }
        case "SET_TEAM_STATUS": {
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