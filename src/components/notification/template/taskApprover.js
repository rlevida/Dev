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
                            <p class="m0">Task Approver</p>
                            <div>
                                <div class="n-title">Lorem ipsum dolor sit amet</div>
                                <div class="display-flex vh-center">
                                    <div class="thumbnail-profile">
                                        <img src={from.avatar} alt="Profile Picture" class="img-responsive" />
                                    </div>
                                    <div>
                                        <p class="m0">{from.firstName + " " + from.lastName + " " + notificationType(data.type)}</p>
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