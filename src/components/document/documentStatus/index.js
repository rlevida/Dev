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

export default class DocumentStatus extends React.Component {
    constructor(props) {
        super(props)
    }

    componentDidMount() {
        let { dispatch, loggedUser } = this.props;
        getData(`/api/document/getDocumentCount?isDeleted=0&linkId=${project}&linkType=project&status=new&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&type=document`, {}, (c) => {
            dispatch({ type: "SET_DOCUMENT_STATUS_COUNT", status: 'new', count: c.data.count })
        })

        getData(`/api/document/getDocumentCount?isDeleted=0&linkId=${project}&linkType=project&status=library&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&type=document`, {}, (c) => {
            dispatch({ type: "SET_DOCUMENT_STATUS_COUNT", status: 'library', count: c.data.count })
        })
    }

    render() {
        let { document } = this.props

        return (<div class="row">
            <div class="col-lg-6 col-xs-12 active-count count">
                <span class="text-white">{document.Status.new}</span>
                <span class="text-white">New Uploads:</span>
            </div>
            <div class="col-lg-6 col-xs-12 on-time count">
                <span class="text-white">{document.Status.library}</span>
                <span class="text-white">Libraries:</span>
            </div>
        </div>)

    }
}