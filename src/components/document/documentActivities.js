import React from "react";
import { Loading } from "../../globalComponents";
import { getData, postData, putData, showToast, deleteData, getParameterByName } from '../../globalFunction';
import { connect } from "react-redux"
import { withRouter } from "react-router";
import moment from "moment";

@connect((store) => {
    return {
        document: store.document,
        loggedUser: store.loggedUser,
        acivities: store.activityLogDocument,
    }
})

class DocumentActivities extends React.Component {
    constructor(props) {
        super(props)
    }

    componentDidMount() {
        this.fetchData(1)
    }

    fetchData(page) {
        const { dispatch, loggedUser, match } = { ...this.props };
        const { projectId } = { ...match.params }

        getData(`/api/activityLogDocument?page=${page}&userType=${loggedUser.userType}&projectId=${projectId}`, {}, (c) => {
            const { result, count } = { ...c.data };
            dispatch({ type: "SET_ACTIVITYLOG_DOCUMENT_LIST", list: result, count: count });
            dispatch({ type: "SET_ACTIVITYLOG_LOADING", loading: "" });
        })
    }

    renderActivityLogs(log) {
        const { dateAdded, user, actionType, type, linkType, title } = { ...log };
        const duration = moment.duration(moment().diff(moment(dateAdded)));
        const date = (duration.asDays() > 1) ? moment(dateAdded).format("MMMM DD, YYYY") : moment(dateAdded).from(new Date());

        if (type === "document") {
            switch (actionType) {
                case "created":
                case "deleted":
                case "archived":
                case "uploaded":
                    return (
                        <div>
                            <p class="ml10 mt10">
                                <strong>{user.firstName + " " + user.lastName + " "}</strong>
                                {`${title} `}
                                <strong>{log.document.origin}</strong>
                                {` ${date}`}
                            </p>
                        </div>
                    )
                case "commented":
                case "moved":
                    return (
                        <div>
                            <p class="ml10 mt10">
                                <strong>{user.firstName + " " + user.lastName + " "}</strong>
                                {`${title} `}
                                <strong>{log.document.origin}</strong>
                                {actionType === "moved" ? " to folder" : ""}
                                {` ${date}`}
                            </p>
                        </div>
                    )
                case "modified":
                    return (
                        <div>
                            <p class="ml10 mt10">
                                <strong>{user.firstName + " " + user.lastName + " "}</strong>
                                {`${title} from `}
                                <strong>{log.old}</strong>
                                {` to `}
                                <strong>{log.new}</strong>
                                {` ${date}`}
                            </p>
                        </div>
                    )
                case "restored":
                    return (
                        <div>
                            <p class="ml10 mt10">
                                <strong>{user.firstName + " " + user.lastName + " "}</strong>
                                {`${title} ${date}`}
                            </p>
                        </div>
                    )
            }
        } else if (type == "conversation") {
            return (
                <div key={users.id} class="comment">
                    <div class="thumbnail-profile">
                        <img src={users.avatar} alt="Profile Picture" class="img-responsive" />
                    </div>
                    <div>
                        <MentionConvert string={comment} />
                        <p class="note m0">Posted {date} by {users.firstName + " " + users.lastName}.</p>
                        <p class="note m0"><a onClick={() => this.replyComment(users)}>Reply</a></p>
                    </div>
                </div>
            )
        }
    }

    render() {
        const { acivities, document, folder, match } = { ...this.props };
        const { Count } = { ...document };
        return (
            <div class={(acivities.Loading == "RETRIEVING") ? "linear-background" : ""}>
                <div class="card-body m0">
                    <div class="ml10 mt20 detail-tabs">
                        <div>
                            {
                                ((acivities.List).length > 0) && <div>
                                    {
                                        _.map(_.sortBy(acivities.List, 'dateAdded').reverse(), (log, index) => {
                                            return (
                                                <div key={index}>
                                                    {
                                                        this.renderActivityLogs({ ...log, type: 'document' })
                                                    }
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                            }
                            {/* {
                                ((activityList).length == 0) && <p class="mb0 text-center"><strong>No Records Found</strong></p>
                            }
                            {
                                (currentActivityLogPage != lastActivityLogPage || currentConversationLogPage != lastConversationLogPage) && <p class="m0 text-center"><a onClick={() => this.getNextActivityLogs()}>Load More Activities</a></p>
                            } */}
                        </div>
                    </div>
                </div>
            </div >
        )
    }
}

export default withRouter(DocumentActivities);