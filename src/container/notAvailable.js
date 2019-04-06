import React from "react"
import ReactDOM from "react-dom"
import { Provider } from "react-redux"

import Component from  "../components/notAvailable"
import Socket from  "../components/socket"

import store from "../store"

const app = document.getElementById("main")

ReactDOM.render(
        <Provider store={store}>
            <div>
                <Socket />
                <Component />
            </div>
        </Provider>,
    app)