import React from "react";
import { Loading } from "../../globalComponents";
import { getData, postData, putData, showToast, deleteData, getParameterByName } from "../../globalFunction";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import moment from "moment";

@connect(store => {
    return {
        document: store.document,
        loggedUser: store.loggedUser,
        activities: store.activityLogDocument
    };
})
class DocumentActivities extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.fetchData(1);
    }

    componentWillUnmount() {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_ACTIVITYLOG_DOCUMENT_LIST", list: {}, count: {} });
        dispatch({ type: "SET_DOCUMENT_ACTIVE_TAB", active: "active" });
    }

    fetchData(page) {
        const { dispatch, loggedUser, match, activities } = { ...this.props };
        const { projectId } = { ...match.params };

        getData(`/api/activityLogDocument?page=${page}&userType=${loggedUser.userType}&projectId=${projectId}`, {}, c => {
            const { result, count } = { ...c.data };
            dispatch({ type: "SET_ACTIVITYLOG_DOCUMENT_LIST", list: activities.List.concat(result), count: count });
            dispatch({ type: "SET_ACTIVITYLOG_LOADING", loading: "" });
        });
    }

    getNextResult() {
        const { dispatch, activities } = this.props;
        dispatch({ type: "SET_ACTIVITYLOG_LOADING", loading: "RETRIEVING" });
        this.fetchData(activities.Count.current_page + 1);
    }

    renderActivityLogs(log) {
        const { dateAdded, user, actionType, title } = { ...log };
        const duration = moment.duration(moment().diff(moment(dateAdded)));
        const date = duration.asDays() > 1 ? moment(dateAdded).format("MMMM DD, YYYY") : moment(dateAdded).from(new Date());
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
                            <strong>
                                {log.document.origin}
                                {log.document.documentNameCount ? `(${log.document.documentNameCount})` : ""}
                            </strong>
                            {` ${date}`}
                        </p>
                    </div>
                );
            case "commented":
            case "moved":
                return (
                    <div>
                        <p class="ml10 mt10">
                            <strong>{user.firstName + " " + user.lastName + " "}</strong>
                            {`${title} `}
                            <strong>
                                {log.document.origin}
                                {log.document.documentNameCount ? `(${log.document.documentNameCount})` : ""}
                            </strong>
                            {actionType === "moved" ? " to folder" : ""}
                            {` ${date}`}
                        </p>
                    </div>
                );
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
                );
            case "restored":
                return (
                    <div>
                        <p class="ml10 mt10">
                            <strong>{user.firstName + " " + user.lastName + " "}</strong>
                            {`${title} ${date}`}
                        </p>
                    </div>
                );
        }
    }

    render() {
        const { activities } = { ...this.props };
        const { Count } = { ...activities };
        const currentPage = typeof Count.current_page != "undefined" ? Count.current_page : 1;
        const lastPage = typeof Count.last_page != "undefined" ? Count.last_page : 1;
        return (
            <div class={activities.Loading == "RETRIEVING" && activities.List.length === 0 ? "linear-background" : ""}>
                <div class="card-body m0">
                    <div class="ml10 mt20 detail-tabs">
                        <div>
                            {activities.List.length > 0 && (
                                <div>
                                    {_.map(_.sortBy(activities.List, "dateAdded").reverse(), (log, index) => {
                                        return <div key={index}>{this.renderActivityLogs(log)}</div>;
                                    })}
                                </div>
                            )}
                            {activities.Loading === "" && activities.List.length == 0 && (
                                <p class="mb0 text-center">
                                    <strong>No Records Found</strong>
                                </p>
                            )}
                            {currentPage != lastPage && activities.List.length > 0 && activities.Loading != "RETRIEVING" && (
                                <p class="mb0 text-center">
                                    <a onClick={() => this.getNextResult()}>Load More Activities</a>
                                </p>
                            )}
                            {activities.Loading === "RETRIEVING" && activities.List.length > 0 && <Loading />}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default withRouter(DocumentActivities);
