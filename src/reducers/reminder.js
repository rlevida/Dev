export default function reducer(state={
    List : [],
    FormActive : "List",
    Selected : {},
    SelectedId : [],
    Loading: true
},action){
    switch (action.type) {
        //ADD
        case "ADD_REMINDER_LIST":{
            let List = state.List;
            action.list.map( e => {
                List.push( e )
            })
            return {...state, List : List }
        }
        //SET
        case "SET_REMINDER_LIST": {
            return { ...state, List: action.list , Loading : false }
        }
        case "SET_REMINDER_FORM_ACTIVE": {
            return { ...state, FormActive: action.FormActive }
        }
        case "SET_REMINDER_SELECTED": {
            return { ...state, Selected: action.Selected }
        }
        default:
            return state;
    }
}