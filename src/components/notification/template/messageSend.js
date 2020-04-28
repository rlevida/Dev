import React from "react";
import { connect } from "react-redux";
import moment from "moment";
import { notificationType } from "../../../globalFunction";
import { MentionConvert } from "../../../globalComponents";

@connect(store => {
    return {
        project: store.project,
        task: store.task,
        loggedUser: store.loggedUser,
        settings: store.settings
    };
})
export default class Component extends React.Component {
    render() {
        const { dispatch, data, index, handleNotificationRedirect, markAsRead, settings } = { ...this.props };
        const { from, dateAdded, conversation_notification } = { ...data };
        const { comment } = { ...conversation_notification };
        const duration = moment.duration(moment().diff(moment(dateAdded)));
        const date = duration.asDays() > 1 ? moment(dateAdded).format("MMMM DD, YYYY") : moment(dateAdded).from(new Date());

        return (
            <div key={index}>
                <li class={`pd0 mb20 ${data.isRead ? "" : "n-unread"}`}>
                    <div class="d-flex-sb">
                        <div class="n">
                            <a href="javascript:void(0)" onClick={() => handleNotificationRedirect(data)}>
                                <p class="m0">Messages</p>
                            </a>
                            <div class="m20">
                                <div class="display-flex vh-center">
                                    <div class="thumbnail-profile">
                                        <img
                                            src={`${settings.site_url}api/file/profile_pictures/${from.avatar}`}
                                            alt="Profile Picture" class="img-responsive" />
                                    </div>
                                    <div class="ml10">
                                        <p class="m0">
                                            <strong>{from.firstName + " " + from.lastName}</strong> {notificationType(data.type)}
                                        </p>
                                        <p class="note m0">{date}</p>
                                    </div>
                                </div>
                                <div class="n-b-content">
                                    <p class="m0 n-message d-flex">
                                        <i class="fa fa-comment-o mr10" />
                                        "<MentionConvert string={comment} />"
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="n-action">
                            <div>
                                {data.isRead === 1 && (
                                    <a href="javascript:void(0)" className="mr10" title="mark as unread" onClick={() => markAsRead(data)}>
                                        <i class="fa fa-eye-slash fa-lg text-grey" />
                                    </a>
                                )}
                                {!data.isArchived && (
                                    <a href="javascript:void(0)" onClick={() => dispatch({ type: "SET_NOTIFICATION_SELECTED", Selected: data })} title="archive" data-toggle="modal" data-target="#archiveModal">
                                        <i class="fa fa-times fa-lg text-grey" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </li>
                <hr />
            </div>
        );
    }
}
