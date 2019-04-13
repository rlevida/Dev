import React from "react";
import { connect } from "react-redux";
import moment from 'moment';
import { notificationType } from "../../../globalFunction";
@connect((store) => {
    return {
        project: store.project,
        task: store.task,
        loggedUser: store.loggedUser,
    }
})
export default class Component extends React.Component {
    render() {
        const { dispatch, data, index } = { ...this.props };
        const { from, dateAdded, workstream_notification, task_notification } = { ...data };
        const { workstream } = { ...workstream_notification };
        const { task } = { ...task_notification };
        const duration = moment.duration(moment().diff(moment(dateAdded)));
        const date = (duration.asDays() > 1) ? moment(dateAdded).format("MMMM DD, YYYY") : moment(dateAdded).from(new Date());
        return (
            <div key={index}>
                <li class="pd0 mb20">
                    <div class="d-flex-sb">
                        <div class="n">
                            <p class="m0"><i class="fa fa-check-circle mr5 n-unread"></i>Task following in <strong>{workstream}</strong></p>
                            <div class="m20">
                                <div class="n-title mb10"><h4><strong>{task}</strong></h4></div>
                                <div class="display-flex vh-center">
                                    <div class="thumbnail-profile">
                                        <img src={from.avatar} alt="Profile Picture" class="img-responsive" />
                                    </div>
                                    <div class="ml10">
                                        <p class="m0"><strong>{from.firstName + " " + from.lastName}</strong> {notificationType(data.type)}</p>
                                        <p class="note m0">{date}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="n-action">
                            {
                                (!data.isArchived) &&
                                <div>
                                    <a href="javascript:void(0)"
                                        onClick={() => dispatch({ type: "SET_NOTIFICATION_SELECTED", Selected: data })}
                                        data-toggle="modal"
                                        data-target="#archiveModal"
                                    >
                                        <i class="fa fa-times fa-lg text-grey"></i>
                                    </a>
                                </div>
                            }
                        </div>
                    </div>
                </li>
                <hr />
            </div>
        )
    }
}