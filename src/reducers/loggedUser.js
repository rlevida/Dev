export default function reducer(state = {
    data: (typeof loggedUser != "undefined") ? loggedUser : {}
}, action) {
    switch (action.type) {
        //Set
        case "SET_LOGGED_USER_DATA": {
            return { ...state }
            return { ...state, data: action.data }
        }
        default:
            return state;
    }
}