export default function reducer(state = {
    List: [],
    FormActive: "List",
    Selected: {},
    SelectedId: [],
    SelectList: [],
    EditType: "",
    SelectedLibraryFolder: {},
    SelectedLibraryFolderName: [],
    SelectedNewFolderName: [],
    SelectedFolderName: [],
    SelectedNewFolder: {},
    New: {},
    Library: {},
    Count: {}
}, action) {
    switch (action.type) {

        //ADD
        case "ADD_FOLDER_LIST": {
            let List = state.List;
            action.list.map(e => {
                List.push(e)
            })
            return { ...state, List: List }
        }

        //SET
        case "SET_FOLDER_LIST": {
            return { ...state, List: action.list, Count: action.count }
        }
        case "SET_FOLDER_SELECTED": {
            return { ...state, Selected: action.Selected }
        }
        case "SET_NEW_FOLDER_SELECTED": {
            return { ...state, SelectedNewFolder: action.Selected }
        }
        case "SET_LIBRARY_FOLDER_SELECTED": {
            return { ...state, SelectedLibraryFolder: action.Selected }
        }
        case "SET_SELECTED_FOLDER_NAME": {
            return { ...state, SelectedFolderName: action.List }
        }
        case "SET_FOLDER_SELECT_LIST": {
            return { ...state, SelectList: action.List }
        }
        // //UPDATE
        case "UPDATE_DATA_FOLDER_LIST": {
            let tempList = state.List.map((e, i) => {
                if (e.id == action.UpdatedData.id) {
                    return action.UpdatedData
                }
                return e
            })
            return { ...state, List: tempList }
        }
        // //REMOVE
        case "REMOVE_DELETED_FOLDER_LIST": {
            let tempList = [];
            state.List.map((e, i) => {
                if (action.id != e.id) {
                    tempList.push(e)
                }
            })
            return { ...state, List: tempList }
        }
        case "CLEAR_FOLDER": {
            return {
                ...state, List: [],
                FormActive: "List",
                Selected: {},
                SelectedId: [],
                SelectList: [],
                EditType: "",
                SelectedLibraryFolder: {},
                SelectedLibraryFolderName: [],
                SelectedNewFolderName: [],
                SelectedNewFolder: {},
                New: {},
                Library: {}
            }
        }
        default:
            return state;
    }
}