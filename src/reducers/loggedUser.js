export default function reducer(state = {
    data: {
        username: "",
        emailAddress: "",
        userType: ""
    }
}, action) {
    switch (action.type) {
        //Set 
        case "SET_LOGGED_USER_DATA": {
            return { ...state, data: action.data }
        }
        default:
            return state;
    }
}