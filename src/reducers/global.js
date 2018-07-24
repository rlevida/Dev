export default function reducer(state={
        NationalityList : []
    },action){
        switch (action.type) {
            case "SET_NATIONALITY_LIST": {
                return { ...state, NationalityList: action.List }
            }
            default:
                return state;
        }
}