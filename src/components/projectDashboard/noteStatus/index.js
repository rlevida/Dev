import React from "react"
import ReactDOM from "react-dom"

import { showToast, getData } from '../../../globalFunction'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
        global: store.global,
        loggedUser: store.loggedUser
    }
})

export default class NotesStatus extends React.Component {
    constructor(props) {
        super(props)
    }

    componentDidMount() {
        
    }

    render() {

        return (
            <div class="container-fluid">
                <div class="row single-status">
                    <div class="col-lg-6 col-xs-12 active-count count">
                        <span class="text-white">0</span>
                        <span class="text-white">Active</span>
                    </div>
                    <div class="col-lg-6 col-xs-12 on-time count">
                        <span class="text-white">0</span>
                        <span class="text-white">New</span>
                    </div>
                </div>
            </div>
        )
    }
}