import React from "react"
import ReactDOM from "react-dom"

import { showToast, getData } from '../../../globalFunction'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
        global: store.global,
        loggedUser: store.loggedUser,
        notes: store.notes
    }
})

export default class NotesStatus extends React.Component {
    constructor(props) {
        super(props)
    }

    componentDidMount() {
        const { loggedUser, dispatch } = this.props;
        getData(`/api/conversation/status?userId=${loggedUser.data.id}&projectId=${project}`, {}, (c) => {
            dispatch({ type: 'SET_NOTES_LIST', list: c.data })
        })
    }

    render() {
        const { notes } = this.props;
        const unread = notes.List.filter((e) => { return !e.isSeen }).length
        return (
            <div class="container-fluid">
                <div class="row single-status">
                    <div class="col-lg-6 col-xs-12 active-count count">
                        <span class="text-white">{notes.List.length}</span>
                        <span class="text-white">Active</span>
                    </div>
                    <div class="col-lg-6 col-xs-12 on-time count">
                        <span class="text-white">{unread}</span>
                        <span class="text-white">New</span>
                    </div>
                </div>
            </div>
        )
    }
}