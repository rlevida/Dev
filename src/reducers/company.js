export default function reducer(state={
        List : [],
        FormActive : "List",
        Selected : {},
        SelectedId: [],
    },action){
        switch (action.type) {
            case "SET_COMPANY_LIST": {
                return { ...state, List: action.list }
            }
            case "SET_COMPANY_FORM_ACTIVE": {
                return { ...state, FormActive: action.FormActive }
            }
            case "SET_COMPANY_SELECTED": {
                return { ...state, Selected: action.Selected }
            }
            case "SET_COMPANY_ID": {
                return { ...state, SelectedId: action.SelectedId }
            }
            case "UPDATE_DATA_COMPANY_LIST" : {
                let tempList = action.List.map((e,i)=>{
                    if(e.id == action.UpdatedData.id){
                        return action.UpdatedData
                    }
                    return e
                })
                return { ...state, List: tempList }
            }
            case "REMOVE_DELETED_COMPANY_LIST" : {
                let tempList = [];
                action.List.map((e,i)=>{
                    if(action.id != e.id){
                        tempList.push(e)
                    }
                })
                return { ...state, List: tempList }
            }
            case "SET_COMPANY_STATUS": {
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