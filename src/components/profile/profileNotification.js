import React from "react";
import { connect } from "react-redux";
import moment from "moment";
import { showToast, getData, putData } from "../../globalFunction";

@connect(store => {
    return {
        loggedUser: store.loggedUser,
        users: store.users
    };
})
export default class ProfileNotification extends React.Component {
    constructor(props) {
        super(props);
        _.map(["handleSubmit", "handleChange"], fn => {
            this[fn] = this[fn].bind(this);
        });
    }
    componentDidMount() {
        const { dispatch, loggedUser } = { ...this.props };
        dispatch({ type: "SET_USER_NOTIFICATION_SELECTED", Setting: loggedUser.data.notification_setting });
    }

    handleChange(name, value) {
        const { dispatch, users } = { ...this.props };
        const notificationObj = { ...users.NotificationSetting, [name]: value };
        dispatch({ type: "SET_USER_NOTIFICATION_SELECTED", Setting: notificationObj });
    }

    handleSubmit() {
        const { dispatch, users, loggedUser } = { ...this.props };
        putData(`/api/user/notificationSetting/${loggedUser.data.id}`, { ...users.NotificationSetting }, c => {
            const { status, data } = { ...c };
            if (status === 200) {
                dispatch({ type: "SET_USER_NOTIFICATION_SELECTED", Setting: data });
                showToast("success", "Successfully Updated.");
            } else {
                showToast("error", "Something went wrong. Please try again later.");
            }
        });
    }

    render() {
        const { users } = { ...this.props };
        const {
            taskAssigned,
            taskAssignedComment,
            taskTagged,
            taskApprover,
            fileNewUpload,
            messageSend,
            commentReplies,
            taskDeadline,
            taskMemberCompleted,
            taskFollowingCompleted,
            taskTeamDeadline,
            taskFollowingDeadline,
            receiveEmail,
            taskBeforeDeadline,
            messageMentioned
        } = {
            ...users.NotificationSetting
        };
        return (
            <div class="mt20">
                <h4>
                    <strong>Send Notification when:</strong>
                </h4>
                <form>
                    <div class="form-group">
                        <label class="custom-checkbox">
                            I have been assigned to do a task
                            <input type="checkbox" checked={taskAssigned ? 1 : 0} onChange={() => {}} onClick={() => this.handleChange("taskAssigned", taskAssigned ? 0 : 1)} />
                            <span class="checkmark" />
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="custom-checkbox">
                            Receive a notification when someone commented on a tasks assigned to you.
                            <input type="checkbox" checked={taskAssignedComment ? 1 : 0} onChange={() => {}} onClick={() => this.handleChange("taskAssignedComment", taskAssignedComment ? 0 : 1)} />
                            <span class="checkmark" />
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="custom-checkbox">
                            I have been assigned to do a task as approver
                            <input type="checkbox" checked={taskApprover ? 1 : 0} onChange={() => {}} onClick={() => this.handleChange("taskApprover", taskApprover ? 0 : 1)} />
                            <span class="checkmark" />
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="custom-checkbox">
                            I was tagged under a task description or comment
                            <input type="checkbox" checked={taskTagged ? 1 : 0} onChange={() => {}} onClick={() => this.handleChange("taskTagged", taskTagged ? 0 : 1)} />
                            <span class="checkmark" />
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="custom-checkbox">
                            A new file has been uploaded
                            <input type="checkbox" checked={fileNewUpload ? 1 : 0} onChange={() => {}} onClick={() => this.handleChange("fileNewUpload", fileNewUpload ? 0 : 1)} />
                            <span class="checkmark" />
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="custom-checkbox">
                            Someone sends me a message
                            <input type="checkbox" checked={messageSend ? 1 : 0} onChange={() => {}} onClick={() => this.handleChange("messageSend", messageSend ? 0 : 1)} />
                            <span class="checkmark" />
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="custom-checkbox">
                            Someone replies to a comment I posted
                            <input type="checkbox" checked={commentReplies ? 1 : 0} onChange={() => {}} onClick={() => this.handleChange("commentReplies", commentReplies ? 0 : 1)} />
                            <span class="checkmark" />
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="custom-checkbox">
                            Someone mentioned me to a message
                            <input type="checkbox" checked={messageMentioned ? 1 : 0} onChange={() => {}} onClick={() => this.handleChange("messageMentioned", messageMentioned ? 0 : 1)} />
                            <span class="checkmark" />
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="custom-checkbox">
                            I go beyond the deadline
                            <input type="checkbox" checked={taskDeadline ? 1 : 0} onChange={() => {}} onClick={() => this.handleChange("taskDeadline", taskDeadline ? 0 : 1)} />
                            <span class="checkmark" />
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="custom-checkbox">
                            Members under my team were able to complete a task
                            <input type="checkbox" checked={taskMemberCompleted ? 1 : 0} onChange={() => {}} checked={taskMemberCompleted ? 1 : 0} onClick={() => this.handleChange("taskMemberCompleted", taskMemberCompleted ? 0 : 1)} />
                            <span class="checkmark" />
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="custom-checkbox">
                            A task I'm following was completed
                            <input type="checkbox" checked={taskFollowingCompleted ? 1 : 0} onChange={() => {}} checked={taskFollowingCompleted ? 1 : 0} onClick={() => this.handleChange("taskFollowingCompleted", taskFollowingCompleted ? 0 : 1)} />
                            <span class="checkmark" />
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="custom-checkbox">
                            A task goes beyond the deadline under my team
                            <input type="checkbox" checked={taskTeamDeadline ? 1 : 0} onChange={() => {}} checked={taskTeamDeadline ? 1 : 0} onClick={() => this.handleChange("taskTeamDeadline", taskTeamDeadline ? 0 : 1)} />
                            <span class="checkmark" />
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="custom-checkbox">
                            A task goes beyond the deadline under the task I'm following
                            <input type="checkbox" checked={taskFollowingDeadline ? 1 : 0} onChange={() => {}} checked={taskFollowingDeadline ? 1 : 0} onClick={() => this.handleChange("taskFollowingDeadline", taskFollowingDeadline ? 0 : 1)} />
                            <span class="checkmark" />
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="custom-checkbox">
                            A task about to be due
                            <input type="checkbox" checked={taskBeforeDeadline ? 1 : 0} onChange={() => {}} checked={taskBeforeDeadline ? 1 : 0} onClick={() => this.handleChange("taskBeforeDeadline", taskBeforeDeadline ? 0 : 1)} />
                            <span class="checkmark" />
                        </label>
                    </div>

                    <h4>
                        <strong>Do you want to receive email notification as well?</strong>
                    </h4>
                    <div class="mb20">
                        <button class={`btn ${receiveEmail ? "btn-cyan" : "btn-default"} mr10`} type="button" onClick={() => this.handleChange("receiveEmail", 1)}>
                            Yes
                        </button>
                        <button class={`btn ${!receiveEmail ? "btn-cyan" : "btn-default"}`} type="button" onClick={() => this.handleChange("receiveEmail", 0)}>
                            No
                        </button>
                    </div>

                    <button class="btn btn-violet" type="button" onClick={this.handleSubmit}>
                        Save Changes
                    </button>
                </form>
            </div>
        );
    }
}
