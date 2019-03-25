import { applyMiddleware, createStore } from "redux"

import logger from "redux-logger"
import thunk from "redux-thunk"
import promise from "redux-promise-middleware"

import reducer from "./reducers"

let store = createStore(reducer);
if (process.env.NODE_ENV == "development") {
    const middleware = applyMiddleware(promise(), thunk)
    store = createStore(reducer, middleware);
} else {
    const middleware = applyMiddleware(promise())
    store = createStore(reducer, middleware);
}
export default store;