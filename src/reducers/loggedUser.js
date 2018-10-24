export default function reducer(state = {
    data: (typeof loggedUser != "undefined") ? loggedUser : {}
}, action) {
    switch (action.type) {
        //Set
        case "SET_LOGGED_USER_DATA": {
            return { ...state }
        }
        default:
            return state;
    }
}