export default function reducer(state={
    imageUrl : "",
    Token: ""
},action){
    switch (action.type) {
        case "UPDATE_SETTINGS": {
            return { ...state, [action.name]: action.value  }
        }
        case "SET_TOKEN": {
            return { ...state, Token:action.Token}
        }
        default:
            return state;
    }
}