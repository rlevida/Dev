export default function reducer(state={
    List : [],
    FormActive : "List",
    Selected : {},
    SelectedId: [],
},action){
    switch (action.type) {

        //ADD
        case "ADD_DOCUMENT_LIST":{
            let List = state.List;
            action.List.map( e => {
                List.push( e )
            })
            return {...state, List : List }
        }

        //SET
        case "SET_DOCUMENT_LIST": {
            return { ...state, List: action.list }
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
        case "SET_DOCUMENT_STATUS": {
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

        //UPDATE
        case "UPDATE_DATA_DOCUMENT_LIST" : {
            let tempList = action.List.map((e,i)=>{
                if(e.id == action.UpdatedData.id){
                    return action.UpdatedData
                }
                return e
            })
            return { ...state, List: tempList }
        }
        
        //REMOVE
        case "REMOVE_DELETED_DOCUMENT_LIST" : {
            let tempList = [];
            action.List.map((e,i)=>{
                if(action.id != e.id){
                    tempList.push(e)
                }
            })
            return { ...state, List: tempList }
        }
      
        default:
            return state;
    }
}