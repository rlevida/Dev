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
        const { dispatch, data, index } = { ...this.props }
        const { from, dateAdded } = { ...data }
        const duration = moment.duration(moment().diff(moment(dateAdded)));
        const date = (duration.asDays() > 1) ? moment(dateAdded).format("MMMM DD, YYYY") : moment(dateAdded).from(new Date());
        return (
            <div>
                <li class="pd0 mb20" key={index}>
                    <div class="d-flex-sb">
                        <div class="n">
                            <div class="n-header"><i class="fa fa-check-circle mr5 n-unread"></i>Comment Replies</div>
                            <div class="n-content">
                                <div class="n-title">Lorem ipsum dolor sit amet</div>
                                <div className="d-flex">
                                    <img class="image-circle" width="30" height="30" src="/images/user.png"></img>
                                    <div class="n-from mr5">{`${from.firstName} ${from.lastName}`}<span></span></div>
                                    <div class="n-action">{notificationType(data.type)}</div>
                                </div>
                                <div class="n-time ml40">{date}</div>
                                {/* <div class="n-b-content">
                                    <a href="javascript:void(0)"><i class="fa fa-circle mr20"></i>{document_notification.origin}</a>
                                </div> */}
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