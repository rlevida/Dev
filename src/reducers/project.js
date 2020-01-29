import { filter } from "lodash";

export default function reducer(
    state = {
        Count: {},
        Filter: {
            projectProgress: "All",
            projectNameSort: "asc",
            projectType: 1,
            typeId: 1,
            isActive: 1
        },
        FormActive: "List",
        List: [],
        Loading: "RETRIEVING",
        ProjectManagerId: "",
        Selected: { isActive: 1 },
        StatusCount: [],
        SelectedId: [],
        SelectList: [],
        Category: {
            Client: {
                list: [],
                count: {},
                loading: "RETRIEVING"
            },
            Internal: {
                list: [],
                count: {},
                loading: "RETRIEVING"
            },
            Private: {
                list: [],
                count: {},
                loading: "RETRIEVING"
            },
            Active: ""
        },
        Page: 0,
        HasNextPage: true
    },
    action
) {
    switch (action.type) {
        case "SET_PROJECT_LIST": {
            return {
                ...state, List: action.list,
                ...(typeof action.count != "undefined" ? { Count: action.count } : {}),
                ...(typeof action.hasNextPage != "undefined" ? { HasNextPage: action.hasNextPage } : {}),
                ...(action.page ? { Page: action.page } : {})
            };
        }
        case "SET_PROJECT_STATUS_COUNT": {
            return { ...state, StatusCount: action.count };
        }
        case "SET_PROJECT_FORM_ACTIVE": {
            return { ...state, FormActive: action.FormActive };
        }
        case "SET_PROJECT_SELECTED": {
            return { ...state, Selected: action.Selected };
        }
        case "SET_PROJECT_ID": {
            return { ...state, SelectedId: action.SelectedId };
        }
        case "SET_PROJECT_MANAGER_ID": {
            return { ...state, ProjectManagerId: action.id };
        }
        case "SET_PROJECT_LOADING": {
            console.log(`action`, action.Loading)
            return { ...state, Loading: action.Loading };
        }
        case "UPDATE_DATA_PROJECT_LIST": {
            let newList = state.List.map((e, i) => {
                if (e.id == action.UpdatedData.id) {
                    return action.UpdatedData;
                }
                return e;
            });
            return { ...state, List: newList };
        }
        case "ARCHIVE_PROJECT": {
            const { List } = { ...state };
            const updatedList = filter(List, o => {
                return o.id != action.id;
            });

            return { ...state, List: updatedList };
        }
        case "REMOVE_DELETED_PROJECT_LIST": {
            const { List } = { ...state };
            const updatedList = filter(List, o => {
                return o.id != action.id;
            });

            return { ...state, List: updatedList };
        }
        case "SET_PROJECT_STATUS": {
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
        case "SET_PROJECT_FILTER": {
            const { Filter } = { ...state };
            const updatedFilter = _.merge({}, Filter, action.filter);
            console.log(action.filter)
            return { ...state, Filter: updatedFilter };
        }
        case "SET_PROJECT_SELECT_LIST": {
            return { ...state, SelectList: action.List };
        }
        case "SET_PROJECT_CATEGORY": {
            return { ...state, Category: { ...state.Category, [action.category]: action.data } };
        }
        case "SET_PROJECT_ACTIVE_CATEGORY": {
            return { ...state, Category: { ...state.Category, Active: action.ActiveCategory } };
        }
        case "RESET_PROJECT": {
            return { ...state, ...action }
        }
        default:
            return state;
    }
}
