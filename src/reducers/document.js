export default function reducer(
    state = {
        List: [],
        Count: {},
        FormActive: "List",
        Selected: {},
        SelectedId: [],
        EditType: "",
        Loading: "RETRIEVING",
        Filter: {
            status: "active"
        },
        ActiveTab: "active",
        DocumentUploadLoading: false,
        Files: [],
        SelectedFields: [],
        LastSelectedIndex: -1,
        SelectedFieldsDragging: [],
        uploadType: null,
        SubFolders: [],
        SelectedFolderOptions: {},
    },
    action
) {
    switch (action.type) {
        case "ADD_DOCUMENT_LIST": {
            let List = state.List;
            action.list.map(e => {
                List.push(e);
            });
            return { ...state, List: List };
        }
        case "SET_DOCUMENT_LIST": {
            return { ...state, List: action.list, Count: { ...(typeof action.count !== "undefined" ? action.count : state.Count) } };
        }
        case "SET_DOCUMENT_FORM_ACTIVE": {
            return { ...state, FormActive: action.FormActive };
        }
        case "SET_DOCUMENT_SELECTED": {
            return { ...state, Selected: action.Selected };
        }
        case "SET_DOCUMENT_EDIT_TYPE": {
            return { ...state, EditType: action.EditType };
        }
        case "SET_DOCUMENT_LOADING": {
            return { ...state, Loading: action.Loading };
        }
        case "SET_DOCUMENT_FILTER": {
            const { Filter } = { ...state };
            const updatedFilter = _.merge({}, _.omit(Filter, action.name), action.filter);
            return { ...state, Filter: updatedFilter };
        }
        case "SET_DOCUMENT_UPLOAD_TYPE": {
            return { ...state, uploadType: action.uploadType };
        }
        case "RESET_DOCUMENT_FILTER": {
            return { ...state, Filter: {} };
        }
        case "SET_DOCUMENT_ACTIVE_TAB": {
            return { ...state, ActiveTab: action.active };
        }
        case "SET_DOCUMENT_FILES": {
            return { ...state, Files: action.Files };
        }
        case "SET_DOCUMENT_SELECTED_FIELDS": {
            return {
                ...state,
                ...(action.Selected ? { SelectedFields: action.Selected } : {}),
                ...(action.LastSelectedIndex ? { LastSelectedIndex: action.LastSelectedIndex } : {})
            };
        }
        case "SET_DOCUMENT_FIELDS_DRAGGING": {
            return { ...state, SelectedFieldsDragging: action.Fields };
        }
        case "UPDATE_DATA_DOCUMENT_LIST": {
            const list = state.List.map((e, i) => {
                if (e.id == action.UpdatedData.id) {
                    return action.UpdatedData;
                }
                return e;
            });
            return { ...state, List: list };
        }
        case "REMOVE_DOCUMENT_FROM_LIST": {
            let list = state.List.filter(e => {
                return e.id !== action.UpdatedData.id;
            });
            return { ...state, List: list };
        }
        case "REMOVE_DOCUMENT_FROM_LIST_BULK": {
            var list = _.filter(state.List, p => {
                return !_.includes(
                    action.list.map(e => {
                        return e.id;
                    }),
                    p.id
                );
            });
            return { ...state, List: list };
        }
        case "SET_SUB_FOLDERS": {
            return {
                ...state, SubFolders: action.list, SelectedFolderOptions: { ...state.SelectedFolderOptions, [action.selectedFolderId]: action.list }
            }
        }
        case "RESET_DOCUMENT": {
            return { ...state, ...action }
        }
        default:
            return state;
    }
}
