export default function reducer(state = {
    List: [],
    FormActive: "List",
    Selected: {},
    SelectedId: [],
    EditType: "",
    DocumentToMove: {},
    DocumentToMoveType: "",
    Loading: true,
    DocumentToPrint: "",
    PrinterList: [],
    Library: [],
    New: []
}, action) {
    switch (action.type) {

        //ADD
        case "ADD_DOCUMENT_LIST": {
            let { New } = { ...state };
            action.list.map(e => {
                New.push(e)
            })
            return { ...state, New: New }
        }

        //SET
        case "SET_DOCUMENT_LIST": {
            return { ...state, List: action.list }
        }
        case "SET_DOCUMENT_NEW_LIST": {
            return { ...state, New: action.list }
        }
        case "SET_DOCUMENT_LIBRARY_LIST": {
            return { ...state, Library: action.list }
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
        //UPDATE
        case "UPDATE_DATA_DOCUMENT_LIST": {
            if (action.Status == "new") {
                let tempList = state.New.map((e, i) => {
                    if (e.id == action.UpdatedData.id) {
                        return action.UpdatedData
                    }
                    return e
                })
                return { ...state, New: tempList }
            } else {
                let tempList = state.Library.map((e, i) => {
                    if (e.id == action.UpdatedData.id) {
                        return action.UpdatedData
                    }
                    return e
                })
                return { ...state, Library: tempList }
            }
        }
        //REMOVE
        case "REMOVE_DELETED_DOCUMENT_LIST": {
            let tempList = [];
            state.List.map((e, i) => {
                if (action.id != e.id) {
                    tempList.push(e)
                }
            })
            return { ...state, List: tempList }
        }

        default:
            return state;
    }
}