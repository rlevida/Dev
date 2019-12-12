import _ from "lodash";
export default function reducer(
    state = {
        Count: {},
        FormActive: "List",
        List: [],
        Loading: "RETRIEVING",
        Filter: {
            workstream: "",
            typeId: "",
            workstreamStatus: "Active"
        },
        StatusCount: {},
        Selected: {},
        SelectedId: [],
        SelectedLink: "",
        SelectList: []
    },
    action
) {
    switch (action.type) {
        case "SET_WORKSTREAM_LIST": {
            return { ...state, List: action.list, ...(typeof action.Count != "undefined" ? { Count: action.Count } : {}) };
        }
        case "ADD_WORKSTREAM": {
            const List = state.List.slice();
            List.unshift(action.data);
            return { ...state, List: List, FormActive: "List", Selected: {} };
        }
        case "UPDATE_WORKSTREAM_LIST": {
            const { List } = { ...state };
            const updatedList = [...List, ...action.list];

            return { ...state, List: updatedList, ...(typeof action.Count != "undefined" ? { Count: action.Count } : {}) };
        }
        case "SET_WORKSTREAM_STATUS_COUNT": {
            return { ...state, StatusCount: action.count };
        }
        case "SET_WORKSTREAM_FORM_ACTIVE": {
            return { ...state, FormActive: action.FormActive };
        }
        case "SET_WORKSTREAM_SELECTED": {
            return { ...state, Selected: action.Selected };
        }
        case "SET_WORKSTREAM_ID": {
            return { ...state, SelectedId: action.SelectedId, ...(action.SelectedId.length ? { Loading: "RETRIEVING" } : {}) };
        }
        case "UPDATE_DATA_WORKSTREAM_LIST": {
            const { List } = { ...state };
            const copyOfList = [...List];
            const { data } = action;
            const updateindex = _.findIndex(copyOfList, { id: data.id });

            if (updateindex < 0) {
                copyOfList.push(data);
            } else {
                copyOfList.splice(updateindex, 1, data);
            }

            return { ...state, List: copyOfList, FormActive: "List", Selected: {} }
        }
        case "REMOVE_DELETED_WORKSTREAM_LIST": {
            const updatedList = _.filter(state.List, e => {
                return e.id != action.id;
            });
            return { ...state, List: updatedList };
        }
        case "SET_WORKSTREAM_STATUS": {
            let List = state.List.map((e, i) => {
                if (e.id == action.record.id) {
                    e.Active = action.record.status;
                    return e;
                } else {
                    return e;
                }
            });
            return { ...state, List: List };
        }
        case "SET_WORKSTREAM_SELECTED_LINK": {
            return { ...state, SelectedLink: action.SelectedLink };
        }
        case "SET_WORKSTREAM_LOADING": {
            return { ...state, Loading: typeof action.Loading != "undefined" ? action.Loading : "" };
        }
        case "EMPTY_WORKSTREAM_LIST": {
            return { ...state, List: [], Count: {} };
        }
        case "SET_WORKSTREAM_FILTER": {
            const { Filter } = { ...state };
            const updatedFilter = _.merge({}, Filter, action.filter);
            return { ...state, Filter: updatedFilter };
        }
        case "SET_WORKSTREAM_SELECT_LIST": {
            return { ...state, SelectList: action.List };
        }
        case "RESET_WORKSTREAM": {
            return { ...state, ...action }
        }
        default:
            return state;
    }
}
