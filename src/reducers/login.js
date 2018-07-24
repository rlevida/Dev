export default function reducer(state={
    username: "",
    password: "",
    rememberMe: false,
    disabled: false
},action){
    switch (action.type) {
        //Set 
        case "SET_LOGIN_DATA": {
            return { ...state, [action.name] : action.value }
        }
        default:
            return state;
    }
}