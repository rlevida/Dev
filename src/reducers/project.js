export default function reducer(state={
        List : [],
        CountList : [],
        FormActive : "List",
        Selected : {},
        SelectedId: [],
    },action){
        switch (action.type) {
            case "SET_PROJECT_LIST": {
                return { ...state, List: action.list }
            }
            case "SET_PROJECT_COUNT_LIST": {
                return { ...state, CountList: action.list }
            }
            case "SET_PROJECT_FORM_ACTIVE": {
                return { ...state, FormActive: action.FormActive }
            }
            case "SET_PROJECT_SELECTED": {
                return { ...state, Selected: action.Selected }
            }
            case "SET_PROJECT_ID": {
                return { ...state, SelectedId: action.SelectedId }
            }
            case "UPDATE_DATA_PROJECT_LIST" : {
                let tempList = action.List.map((e,i)=>{
                    if(e.id == action.UpdatedData.id){
                        return action.UpdatedData
                    }
                    return e
                })
                return { ...state, List: tempList }
            }
            case "REMOVE_DELETED_PROJECT_LIST" : {
                let tempList = [];
                action.List.map((e,i)=>{
                    if(action.id != e.id){
                        tempList.push(e)
                    }
                })
                return { ...state, List: tempList }
            }
            case "SET_PROJECT_STATUS": {
                let List = state.List.map((e,i)=>{
                        if(e.id == action.record.id){
                            e.Active = action.record.status
                            return e
                        }else{
                            return e
                        }
                    })
                return {...state, List: List }
            }
            default:
                return state;
        }
}