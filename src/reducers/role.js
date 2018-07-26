export default function reducer(state={
        List : []
    },action){
        switch (action.type) {
            case "SET_ROLE_LIST": {
                return { ...state, List: action.list }
            }
            default:
                return state;
        }
}