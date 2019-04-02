import React from "react";
import { connect } from "react-redux";
import moment from "moment";
import { showToast, getData, putData } from '../../globalFunction'


@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        users: store.users
    }
})
export default class ProfileNotification extends React.Component {
    constructor(props) {
        super(props);
        _.map(["handleSubmit", "handleChange"], (fn) => {
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
        putData(`/api/user/notificationSetting/${loggedUser.data.id}`, { ...users.NotificationSetting }, (c) => {
            const { status, data } = { ...c };
            if (status === 200) {
                console.log(data)
                dispatch({ type: "SET_USER_NOTIFICATION_SELECTED", Setting: data });
                showToast('success', 'Successfully Updated.');
            } else {
                showToast('error', 'Something went wrong. Please try again later.');
            }
        })
    }

    render() {
        const { users, loggedUser } = { ...this.props };
        const { taskAssigned, taskTagged, fileNewUpload, messageSend, commentReplies, taskDeadline, taskMemberCompleted, taskFollowingCompleted, taskTeamDeadline, taskFollowingDeadline } = { ...users.NotificationSetting }
        console.log(users)
        return (
            <div>
                <h4><strong>Send Notification when:</strong></h4>
                <form>
                    <div class="form-group">
                        <div class="form-check">
                            <input class="form-check-input mr10"
                                type="checkbox"
                                id="taskAssigned"
                                checked={taskAssigned ? 1 : 0}
                                onClick={() => this.handleChange('taskAssigned', taskAssigned ? 0 : 1)}
                            />
                            <label class="form-check-label" for="taskAssigned">
                                I have been assigned to do a task
                        </label>
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="form-check">
                            <input class="form-check-input mr10"
                                type="checkbox"
                                id="taskTagged"
                                checked={taskTagged ? 1 : 0}
                                onClick={() => this.handleChange('taskTagged', taskTagged ? 0 : 1)}
                            />
                            <label class="form-check-label" for="taskTagged">
                                I was tagged under a task description or comment
                        </label>
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="form-check">
                            <input class="form-check-input mr10"
                                type="checkbox"
                                id="fileNewUpload"
                                checked={fileNewUpload ? 1 : 0}
                                onClick={() => this.handleChange('fileNewUpload', fileNewUpload ? 0 : 1)}
                            />
                            <label class="form-check-label" for="fileNewUpload">
                                A new file has been uploaded
                        </label>
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="form-check">
                            <input class="form-check-input mr10"
                                type="checkbox"
                                id="messageSend"
                                checked={messageSend ? 1 : 0}
                                onClick={() => this.handleChange('messageSend', messageSend ? 0 : 1)}
                            />
                            <label class="form-check-label" for="messageSend">
                                Someone sends me a message
                        </label>
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="form-check">
                            <input class="form-check-input mr10"
                                type="checkbox"
                                id="defaultCheck2"
                                checked={commentReplies ? 1 : 0}
                                onClick={() => this.handleChange('commentReplies', commentReplies ? 0 : 1)}
                            />
                            <label class="form-check-label" for="defaultCheck2">
                                Someone replies to a comment I posted
                        </label>
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="form-check">
                            <input class="form-check-input mr10"
                                type="checkbox"
                                id="taskDeadline"
                                checked={taskDeadline ? 1 : 0}
                                onClick={() => this.handleChange('taskDeadline', taskDeadline ? 0 : 1)}
                            />
                            <label class="form-check-label" for="taskDeadline">
                                I go beyond the deadline
                        </label>
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="form-check">
                            <input class="form-check-input mr10"
                                type="checkbox"
                                id="taskMemberCompleted"
                                checked={taskMemberCompleted ? 1 : 0}
                                onClick={() => this.handleChange('taskMemberCompleted', taskMemberCompleted ? 0 : 1)}
                            />
                            <label class="form-check-label" for="taskMemberCompleted">
                                Members under my team were able to complete a task
                        </label>
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="form-check">
                            <input class="form-check-input mr10"
                                type="checkbox"
                                id="taskFollowingCompleted"
                                checked={taskFollowingCompleted ? 1 : 0}
                                onClick={() => this.handleChange('taskFollowingCompleted', taskFollowingCompleted ? 0 : 1)}
                            />
                            <label class="form-check-label" for="taskFollowingCompleted">
                                A task I'm following was completed
                        </label>
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="form-check">
                            <input class="form-check-input mr10"
                                type="checkbox"
                                id="taskTeamDeadline"
                                checked={taskTeamDeadline ? 1 : 0}
                                onClick={() => this.handleChange('taskTeamDeadline', taskTeamDeadline ? 0 : 1)}
                            />
                            <label class="form-check-label" for="taskTeamDeadline">
                                A task goes beyond the deadline under my team
                        </label>
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="form-check">
                            <input class="form-check-input mr10"
                                type="checkbox"
                                id="taskFollowingDeadline"
                                checked={taskFollowingDeadline ? 1 : 0}
                                onClick={() => this.handleChange('taskFollowingDeadline', taskFollowingDeadline ? 0 : 1)}
                            />
                            <label class="form-check-label" for="taskFollowingDeadline">
                                A task goes beyond the deadline under the task I'm following
                        </label>
                        </div>
                    </div>
                    <button class="btn btn-violet" type="button" onClick={this.handleSubmit}>Save Changes</button>
                </form>
            </div >
        )
    }
}