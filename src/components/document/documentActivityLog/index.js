import React from "react";
import { connect } from "react-redux";
import { deleteData, displayDate, getData, postData, putData, showToast } from '../../../globalFunction';

@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
        loggedUser: store.loggedUser,
        workstream: store.workstream,
        settings: store.settings,
        starred: store.starred,
        global: store.global,
        task: store.task,
        project: store.project,
        activityLogDocument: store.activityLogDocument

    }
})

export default class DocumentActivityLog extends React.Component {
    constructor(props) {
        super(props)
    }

    componentDidMount() {
        const { dispatch } = this.props;
        getData(`/api/activityLogDocument?projectId=${project}`, {}, (c) => {
            dispatch({ type: 'SET_ACTIVITYLOG_DOCUMENT_LIST', list: c.data })
        })
    }

    render() {
        const { activityLogDocument } = this.props;
        return (
            <div class="m20">
                <h4>Activity Logs</h4>
                {(activityLogDocument.List.length > 0) &&
                    activityLogDocument.List.map((data, index) => {
                        return (<p></p>)
                    })
                }
            </div>
        )
    }
}