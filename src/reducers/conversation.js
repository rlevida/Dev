export default function reducer(state={
    List : [],
    FormActive : "List",
    Selected : {},
    SelectedId: [],
},action){
    switch (action.type) {

        //ADD
        case "ADD_COMMENT_LIST":{
            let List = state.List;
            action.list.map( e => {
                List.push( e )
            })
            return {...state, List : List }
        }

        //SET
        case "SET_COMMENT_LIST": {
            return { ...state, List: action.list }
        }
        case "SET_COMMENT_FORM_ACTIVE": {
            return { ...state, FormActive: action.FormActive }
        }
        case "SET_COMMENT_SELECTED": {
            return { ...state, Selected: action.Selected }
        }
        case "SET_COMMENT_ID": {
            return { ...state, SelectedId: action.SelectedId }
        }
        case "SET_COMMENT_STATUS": {
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
        case "UPDATE_DATA_COMMENT_LIST" : {
            let tempList = action.list.map((e,i)=>{
                if(e.id == action.UpdatedData.id){
                    return action.UpdatedData
                }
                return e
            })
            return { ...state, List: tempList }
        }
        
        //REMOVE
        case "REMOVE_DELETED_COMMENT_LIST" : {
            let tempList = [];
            action.list.map((e,i)=>{
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