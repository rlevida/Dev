import _ from "lodash";

export default function reducer(state = {
    Selected: { },
}, action) {
    switch (action.type) {
        case "SET_NOTIFICATION_SELECTED": {
            console.log(action.Selected)
            return { ...state, Selected: action.Selected }
        }
        default:
            return state;
    }
}