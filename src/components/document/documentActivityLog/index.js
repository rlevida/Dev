import React from "react";
import { connect } from "react-redux";
import moment from "moment";
import { deleteData, displayDate, getData, postData, putData, showToast } from '../../../globalFunction';
import { Loading } from '../../../globalComponents';

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
        this.fetchData = this.fetchData.bind(this)
    }

    componentDidMount() {
        const { activityLogDocument } = this.props;
        if (_.isEmpty(activityLogDocument.Count)) {
            this.fetchData(1)
        }
    }

    fetchData(page) {
        const { dispatch, activityLogDocument } = this.props;
        getData(`/api/activityLogDocument?projectId=${project}&page=${page}`, {}, (c) => {
            dispatch({ type: 'SET_ACTIVITYLOG_DOCUMENT_LIST', list: activityLogDocument.List.concat(c.data.result), count: c.data.count })
        })
    }

    getNextResult() {
        let { activityLogDocument, } = this.props;
        this.fetchData(activityLogDocument.Count.current_page + 1)
    }


    render() {
        const { activityLogDocument } = this.props;
        const currentPage = (typeof activityLogDocument.Count.current_page != "undefined") ? activityLogDocument.Count.current_page : 1;
        const lastPage = (typeof activityLogDocument.Count.last_page != "undefined") ? activityLogDocument.Count.last_page : 1;
        return (
            <div class="m20">
                <h4>Activity Logs</h4>
                {(activityLogDocument.List.length > 0) &&
                    activityLogDocument.List.map((data, index) => {
                        if (data.actionType === 'created' || data.actionType === 'duplicated') {
                            return (
                                <div key={index} style={{ backgroundColor: '#fff', borderRadius: '5px' }}>
                                    <div class="m10 p10">
                                        <label>{data.title}</label>
                                        <p>{data.new}</p>
                                        <p style={{ fontSize: '10px' }}>{`${moment(data.dateAdded).format("LLL")} - ${data.user.emailAddress}`}</p>
                                    </div>
                                </div>

                            )
                        }
                        if (data.actionType === 'modified') {
                            return (
                                <div key={index} style={{ backgroundColor: '#fff', borderRadius: '5px' }}>
                                    <div class="m10 p10">
                                        <label>{data.title}</label>
                                        <p>From {(data.old === '') ? "''" : data.old} to {(data.new === '') ? "''" : data.new}</p>
                                        <p style={{ fontSize: '10px' }}>{`${moment(data.dateAdded).format("LLL")} - ${data.user.emailAddress}`}</p>
                                    </div>
                                </div>
                            )
                        }
                        if (data.actionType === 'deleted' || data.actionType === 'moved' || data.actionType === 'shared') {
                            return (
                                <div key={index} style={{ backgroundColor: '#fff', borderRadius: '5px' }}>
                                    <div class="m10 p10">
                                        <label>{data.title}</label>
                                        <p>{data.old}</p>
                                        <p style={{ fontSize: '10px' }}>{`${moment(data.dateAdded).format("LLL")} - ${data.user.emailAddress}`}</p>
                                    </div>
                                </div>
                            )
                        }
                    })
                }
                <div class="text-center">
                    {
                        ((currentPage != lastPage) && activityLogDocument.List.length > 0 && document.Loading != "RETRIEVING") && <a onClick={() => this.getNextResult()}>Load More Activity logs</a>
                    }
                    {
                        (activityLogDocument.List.length == 0 && activityLogDocument.Loading != "RETRIEVING") && <p>No Records Found</p>
                    }
                </div>
                {
                    (activityLogDocument.Loading == "RETRIEVING") && <Loading />
                }
            </div>
        )
    }
}