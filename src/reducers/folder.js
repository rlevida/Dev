export default function reducer(state = {
    List: [],
    FormActive: "List",
    Selected: {},
    SelectedId: [],
    EditType: "",
    SelectedLibraryFolder: {},
    SelectedNewFolder: {},
    New: {},
    Library: {}

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
            return { ...state, List: action.list }
        }
        // case "SET_DOCUMENT_FORM_ACTIVE": {
        //     return { ...state, FormActive: action.FormActive }
        // }
        case "SET_FOLDER_SELECTED": {
            return { ...state, [action.Type]: action.Selected }
        }
        case "SET_NEW_FOLDER_SELECTED": {
            return { ...state, SelectedNewFolder: action.Selected }
        }
        case "SET_LIBRARY_FOLDER_SELECTED": {
            return { ...state, SelectedLibraryFolder: action.Selected }
        }
        // case "SET_DOCUMENT_ID": {
        //     return { ...state, SelectedId: action.SelectedId }
        // }
        // case "SET_DOCUMENT_STATUS": {
        //     let List = state.List.map((e,i)=>{
        //             if(e.id == action.record.id){
        //                 e.Active = action.record.status
        //                 return e
        //             }else{
        //                 return e
        //             }
        //         })
        //     return {...state, List: List }
        // }

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

        default:
            return state;
    }
}