export default function reducer(state = {
    List: [],
    Count: {},
    FormActive: "List",
    Selected: {},
    SelectedId: [],
    EditType: "",
    DocumentToMove: {},
    DocumentToMoveType: "",
    Loading: "RETRIEVING",
    DocumentToPrint: "",
    PrinterList: [],
    Library: [],
    New: [],
    Trash: [],
    NewDocumentLoading: "RETRIEVING",
    LibraryDocumentLoading: "RETRIEVING",
    TrashDocumentLoading: "RETRIEVING",
    NewCount: { Count: {} },
    LibraryCount: { Count: {} },
    TrashCount: { Count: {} },
    NewUploadCount: 0,
    Filter: {
        status: 'active'
    },
    Status: {
        new: 0,
        library: 0
    },
    ActiveTab: 'document',
    DocumentToSave: [],
    DocumentUploadLoading: false,
    Files: [],
}, action) {
    switch (action.type) {
        case "ADD_DOCUMENT_LIST": {
            return { ...state, List: state.List.concat(action.List) }
        }
        case "MOVE_DOCUMENT_TO_LIBRARY": {
            let { Library } = { ...state };
            Library.push(action.UpdatedData)
            return { ...state, Library: Library }
        }
        case "SET_DOCUMENT_LIST": {
            return { ...state, List: action.list, Count: action.count }
        }
        case "SET_DOCUMENT_NEW_LIST": {
            return { ...state, New: action.list, NewCount: (typeof action.count != "undefined") ? action.count : state.NewCount }
        }
        case "SET_DOCUMENT_LIBRARY_LIST": {
            return { ...state, Library: action.list, LibraryCount: (typeof action.count != "undefined") ? action.count : state.NewCount }
        }
        case "SET_DOCUMENT_FORM_ACTIVE": {
            return { ...state, FormActive: action.FormActive }
        }
        case "SET_DOCUMENT_SELECTED": {
            return { ...state, Selected: action.Selected }
        }
        case "SET_DOCUMENT_ID": {
            return { ...state, SelectedId: action.SelectedId }
        }
        case "SET_DOCUMENT_EDIT_TYPE": {
            return { ...state, EditType: action.EditType }
        }
        case "SET_DOCUMENT_STATUS": {
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
        case "SET_DOCUMENT_TO_MOVE": {
            return { ...state, DocumentToMove: action.DocumentToMove, DocumentToMoveType: action.DocType }
        }
        case "SET_DOCUMENT_TO_PRINT": {
            return { ...state, DocumentToPrint: action.DocumentToPrint }
        }
        case "SET_PRINTER_LIST": {
            return { ...state, PrinterList: action.List }
        }
        case "SET_DOCUMENT_LOADING": {
            return { ...state, Loading: action.Loading }
        }
        case "SET_NEW_DOCUMENT_LOADING": {
            return { ...state, NewDocumentLoading: action.Loading }
        }
        case "SET_LIBRARY_DOCUMENT_LOADING": {
            return { ...state, LibraryDocumentLoading: action.Loading }
        }
        case "SET_DOCUMENT_NEW_UPLOAD_COUNT": {
            return { ...state, NewUploadCount: action.Count }
        }
        case "SET_DOCUMENT_FILTER": {
            const { Filter } = { ...state };
            const updatedFilter = _.merge({}, _.omit(Filter, action.name), action.filter);
            return { ...state, Filter: updatedFilter }
        }
        case 'RESET_DOCUMENT_FILTER': {
            return { ...state, Filter: {} }
        }
        case "SET_DOCUMENT_STATUS_COUNT": {
            const { Status } = { ...state };
            return { ...state, Status: { ...Status, [action.status]: action.count } }
        }
        case "SET_DOCUMENT_ACTIVE_TAB": {
            return { ...state, ActiveTab: action.active }
        }
        case "SET_DOCUMENT_TO_SAVE": {
            return { ...state, DocumentToSave: action.DocumentToSave }
        }
        case "SET_DOCUMENT_UPLOAD_LOADING": {
            return { ...state, DocumentUploadLoading: action.Loading }
        }
        case "SET_DOCUMENT_FILES": {
            return { ...state, Files: action.Files }
        }
        case "UPDATE_DATA_DOCUMENT_LIST": {
            const tempList = state.List.map((e, i) => {
                if (e.id == action.UpdatedData.id) {
                    return action.UpdatedData
                }
                return e
            })
            return { ...state, List: tempList }
        }
        case "REMOVE_DOCUMENT_FROM_LIST": {
            let tempList = state.List.filter((e) => { return e.id !== action.UpdatedData.id })
            return { ...state, List: tempList }
           
        }
        case "REMOVE_DELETED_DOCUMENT_LIST": {
            return { ...state, List: _.filter(state.List, (e) => { return e.id !== action.Id }) }
        }
        default:
            return state;
    }
}