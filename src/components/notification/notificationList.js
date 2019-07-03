import React from "react";
import { Loading } from "../../globalComponents";
import { getData, putData, showToast } from "../../globalFunction";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import _ from "lodash";
import FileNewUpload from "./template/fileNewUpload";
import TaskAssgined from "./template/taskAssigned";
import TaskApprover from "./template/taskApprover";
import MessageSend from "./template/messageSend";
import TaskTagged from "./template/taskTagged";
import CommentReplies from "./template/commentReplies";
import TaskMemberCompleted from "./template/taskMemberCompleted";
import TaskFollowingCompleted from "./template/taskFollowingCompleted";
import TaskDeadline from "./template/taskDeadLine";
import TaskTeamDeadline from "./template/taskTeamDeadline";
import TaskFollowingDeadline from "./template/taskFollowingDeadline";
import TaskResponsibleDeadline from "./template/taskResponsibleDeadline";
import FileTagged from "./template/fileTagged";
import ArchivedModal from "./archiveModal";
import MarkAsReadModal from "./markAsReadModal";
import TaskAssginedComment from "./template/taskAssignedComment";
import MessageMentioned from "./template/messageMentioned";

@connect(store => {
    return {
        loggedUser: store.loggedUser,
        notification: store.notification
    };
})
class NotificationList extends React.Component {
    constructor(props) {
        super(props);
        _.map(["fetchData", "getNextResult", "archive", "handleNotificationRedirect", "markAsRead"], fn => {
            this[fn] = this[fn].bind(this);
        });
    }

    async componentDidMount() {
        const { dispatch } = { ...this.props };
        await dispatch({ type: "SET_NOTIFICATION_LIST", list: [] });
        await this.fetchData(1);
    }

    fetchData(page) {
        const { dispatch, loggedUser, notification } = { ...this.props };
        const { List, Filter } = { ...notification };

        dispatch({ type: "SET_NOTIFICATION_LOADING", loading: "RETRIEVING" });
        getData(`/api/notification?page=${page}&usersId=${loggedUser.data.id}&isArchived=${Filter.isArchived}&isDeleted=${Filter.isDeleted}`, {}, c => {
            const { count, result } = { ...c.data };
            dispatch({ type: "SET_NOTIFICATION_LOADING", loading: "" });
            dispatch({ type: "SET_NOTIFICATION_LIST", list: List.concat(result), count: count });
        });
    }

    getNextResult() {
        const { notification } = { ...this.props };
        const { Count } = { ...notification };
        this.fetchData(Count.current_page + 1);
    }

    archive(data) {
        const { dispatch, loggedUser } = { ...this.props };
        putData(`/api/notification/archive/${data.id}?page=1&usersId=${loggedUser.data.id}&isRead=0&isDeleted=0&isArchived=0`, { isArchived: 1 }, c => {
            const { count, result } = { ...c.data };
            dispatch({ type: "SET_NOTIFICATION_LIST", list: result, count: count });
            showToast("success", "Successfully Archived.");
        });
    }

    async handleNotificationRedirect(notif) {
        const { history, dispatch, loggedUser } = { ...this.props };
        const { taskId, workstreamId, projectId } = { ...notif };
        if (!notif.isRead) {
            await putData(`/api/notification/${notif.id}?page=1&usersId=${loggedUser.data.id}&isRead=0&isDeleted=0&isArchived=0`, { isRead: 1 }, c => {
                dispatch({ type: "UPDATE_DATA_NOTIFICATION_LIST", updatedData: c.data });
            });
        }

        let url = `/projects/${projectId}`;
        switch (notif.type) {
            case "fileNewUpload":
                {
                    if (notif.taskId === null) {
                        history.push(`${url}/workstreams/${workstreamId}?tab=document`);
                    } else {
                        history.push(`${url}/workstreams/${workstreamId}?task-id=${taskId}`);
                    }
                }
                break;
            case "messageSend":
            case "messageMentioned":
                {
                    history.push(`${url}/messages?note-id=${notif.note_notification.id}`);
                }
                break;
            case "taskAssgined":
            case "taskAssignedComment":
            case "taskApprover":
            case "taskTagged":
            case "taskApproved":
            case "commentReplies":
            case "taskMemberCompleted":
            case "taskFollowingCompleted":
            case "taskDeadline":
            case "taskTeamDeadline":
            case "taskFollowingDeadline":
            case "taskResponsibleDeadline":
            case "taskResponsibleBeforeDeadLine":
            case "taskBeforeDeadline":
            case "taskAssigned":
                {
                    history.push(`${url}/workstreams/${workstreamId}?task-id=${taskId}`);
                }
                break;
        }
    }

    async markAsRead(data) {
        const { loggedUser, dispatch } = { ...this.props };
        await putData(`/api/notification/${data.id}?page=1&usersId=${loggedUser.data.id}&isRead=0&isDeleted=0&isArchived=0`, { isRead: 0 }, c => {
            dispatch({ type: "UPDATE_DATA_NOTIFICATION_LIST", updatedData: c.data });
            showToast("success", "Successfully Updated.");
        });
    }

    render() {
        const { notification } = { ...this.props };
        const { Count, List } = { ...notification };
        const currentPage = typeof Count.current_page != "undefined" ? Count.current_page : 1;
        const lastPage = typeof Count.last_page != "undefined" ? Count.last_page : 1;
        return (
            <div>
                <div>
                    <div class="card-header" />
                    <div>
                        <div class="card-body m0">
                            <ul class="n-list">
                                {notification.Loading === "" &&
                                    _.orderBy(List, ["isRead"], ["asc"]).map((e, i) => {
                                        switch (e.type) {
                                            case "fileNewUpload": {
                                                return (
                                                    <div key={i}>
                                                        <FileNewUpload data={e} index={i} archive={data => this.archive(data)} handleNotificationRedirect={data => this.handleNotificationRedirect(data)} markAsRead={this.markAsRead} />
                                                    </div>
                                                );
                                            }
                                            case "fileTagged": {
                                                return (
                                                    <div key={i}>
                                                        <FileTagged data={e} index={i} archive={data => this.archive(data)} handleNotificationRedirect={data => this.handleNotificationRedirect(data)} markAsRead={this.markAsRead} />
                                                    </div>
                                                );
                                            }
                                            case "taskAssigned": {
                                                return (
                                                    <div key={i}>
                                                        <TaskAssgined data={e} index={i} archive={data => this.archive(data)} handleNotificationRedirect={data => this.handleNotificationRedirect(data)} markAsRead={this.markAsRead} />
                                                    </div>
                                                );
                                            }
                                            case "taskApproved":
                                            case "taskApprover": {
                                                return (
                                                    <div key={i}>
                                                        <TaskApprover data={e} index={i} archive={data => this.archive(data)} handleNotificationRedirect={data => this.handleNotificationRedirect(data)} markAsRead={this.markAsRead} />
                                                    </div>
                                                );
                                            }
                                            case "messageSend": {
                                                return (
                                                    <div key={i}>
                                                        <MessageSend data={e} index={i} archive={data => this.archive(data)} handleNotificationRedirect={data => this.handleNotificationRedirect(data)} markAsRead={this.markAsRead} />
                                                    </div>
                                                );
                                            }
                                            case "messageMentioned": {
                                                return (
                                                    <div key={i}>
                                                        <MessageMentioned data={e} index={i} archive={data => this.archive(data)} handleNotificationRedirect={data => this.handleNotificationRedirect(data)} markAsRead={this.markAsRead} />
                                                    </div>
                                                );
                                            }
                                            case "taskTagged": {
                                                return (
                                                    <div key={i}>
                                                        <TaskTagged data={e} index={i} archive={data => this.archive(data)} handleNotificationRedirect={data => this.handleNotificationRedirect(data)} markAsRead={this.markAsRead} />
                                                    </div>
                                                );
                                            }
                                            case "commentReplies": {
                                                return (
                                                    <div key={i}>
                                                        <CommentReplies data={e} index={i} archive={data => this.archive(data)} handleNotificationRedirect={data => this.handleNotificationRedirect(data)} markAsRead={this.markAsRead} />
                                                    </div>
                                                );
                                            }
                                            case "taskFollowingCompleted": {
                                                return (
                                                    <div key={i}>
                                                        <TaskFollowingCompleted data={e} index={i} archive={data => this.archive(data)} handleNotificationRedirect={data => this.handleNotificationRedirect(data)} markAsRead={this.markAsRead} />
                                                    </div>
                                                );
                                            }
                                            case "taskMemberCompleted": {
                                                return (
                                                    <div key={i}>
                                                        <TaskMemberCompleted data={e} index={i} archive={data => this.archive(data)} handleNotificationRedirect={data => this.handleNotificationRedirect(data)} markAsRead={this.markAsRead} />
                                                    </div>
                                                );
                                            }
                                            case "taskDeadline": {
                                                return (
                                                    <div key={i}>
                                                        <TaskDeadline data={e} index={i} archive={data => this.archive(data)} handleNotificationRedirect={data => this.handleNotificationRedirect(data)} markAsRead={this.markAsRead} />
                                                    </div>
                                                );
                                            }
                                            case "taskTeamDeadline": {
                                                return (
                                                    <div key={i}>
                                                        <TaskTeamDeadline data={e} index={i} archive={data => this.archive(data)} handleNotificationRedirect={data => this.handleNotificationRedirect(data)} markAsRead={this.markAsRead} />
                                                    </div>
                                                );
                                            }
                                            case "taskFollowingDeadline": {
                                                return (
                                                    <div key={i}>
                                                        <TaskFollowingDeadline data={e} index={i} archive={data => this.archive(data)} handleNotificationRedirect={data => this.handleNotificationRedirect(data)} markAsRead={this.markAsRead} />
                                                    </div>
                                                );
                                            }
                                            case "taskApproved": {
                                                return (
                                                    <div key={i}>
                                                        <TaskFollowingDeadline data={e} index={i} archive={data => this.archive(data)} handleNotificationRedirect={data => this.handleNotificationRedirect(data)} markAsRead={this.markAsRead} />
                                                    </div>
                                                );
                                            }
                                            case "taskAssignedComment": {
                                                return (
                                                    <div key={i}>
                                                        <TaskAssginedComment data={e} index={i} archive={data => this.archive(data)} handleNotificationRedirect={data => this.handleNotificationRedirect(data)} markAsRead={this.markAsRead} />
                                                    </div>
                                                );
                                            }
                                            case "taskResponsibleDeadLine":
                                            case "taskResponsibleBeforeDeadline":
                                            case "taskBeforeDeadline": {
                                                return (
                                                    <div key={i}>
                                                        <TaskResponsibleDeadline data={e} index={i} archive={data => this.archive(data)} handleNotificationRedirect={data => this.handleNotificationRedirect(data)} markAsRead={this.markAsRead} />
                                                    </div>
                                                );
                                            }
                                            default:
                                                return;
                                        }
                                    })}
                            </ul>
                        </div>
                        {currentPage != lastPage && List.length > 0 && notification.Loading != "RETRIEVING" && (
                            <p class="mb0 text-center">
                                <a onClick={() => this.getNextResult()}>Load More Notifications</a>
                            </p>
                        )}
                        {notification.Loading === "RETRIEVING" && List.length > 0 && <Loading />}
                        {List.length === 0 && notification.Loading != "RETRIEVING" && (
                            <p class="mb0 text-center">
                                <strong>No Records Found</strong>
                            </p>
                        )}
                    </div>
                </div>
                <ArchivedModal />
                <MarkAsReadModal />
            </div>
        );
    }
}

export default withRouter(NotificationList);
