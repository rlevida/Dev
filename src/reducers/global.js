export default function reducer(state={
        NationalityList : [],
        SelectList:[]
    },action){
        switch (action.type) {
            case "SET_NATIONALITY_LIST": {
                return { ...state, NationalityList: action.List }
            }
            case "SET_APPLICATION_SELECT_LIST": {
                let { SelectList } = { ...state }
                let hasData = false;
                let tempName = Object.keys(SelectList);
                tempName.map((e,i)=>{
                    if(e == action.name){
                        hasData = true;
                        SelectList[e] = action.List
                    }
                })
                if(!hasData){
                    SelectList[action.name] = action.List
                }

                return { ...state, SelectList: SelectList }
            }
            default:
                return state;
        }
}