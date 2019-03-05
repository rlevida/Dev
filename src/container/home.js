import React from "react"
import ReactDOM from "react-dom"
import { Provider } from "react-redux"

import Main from  "../components/main"
import Socket from  "../components/socket"

import store from "../store"

const app = document.getElementById("main")

ReactDOM.render(
        <Provider store={store}>
            <div>
                <Socket />
                <Main />
            </div>
        </Provider>,
    app)