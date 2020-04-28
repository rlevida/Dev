export default function reducer(state = {
    imageUrl: '',
    token: '',
    site_url: ''
}, action) {
    switch (action.type) {
        case "UPDATE_SETTINGS": {
            return { ...state, ...action.value }
        }
        default:
            return state;
    }
}