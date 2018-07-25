export default function reducer(state={
        List : []
    },action){
        switch (action.type) {
            case "SET_STATUS_LIST": {
                return { ...state, List: action.list }
            }
            default:
                return state;
        }
}