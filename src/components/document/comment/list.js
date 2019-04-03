import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { MentionConvert } from "../../../globalComponents";
import moment from 'moment';

@connect(({ task, conversation }) => {
    return {
        task,
        conversation,
    }
})

export default class List extends React.Component {
    constructor(props) {
        super(props)
    }
    render() {
        const { conversation } = { ...this.props };

        return (
            <div>
                {
                    (conversation.List.length > 0) &&
                    _.map(conversation.List, (o, index) => {
                        const date = moment(o.dateAdded).from(new Date());
                        return (
                            <div key={index} class="comment bg-white">
                                <div class="thumbnail-profile">
                                    <img src={o.users.avatar} alt="Profile Picture" class="img-responsive" />
                                </div>
                                <div>
                                    <MentionConvert string={o.comment} />
                                    <p class="note m0">Posted {date} by {o.users.firstName + " " + o.users.lastName}.</p>
                                </div>
                            </div>
                        )
                    })
                }
            </div>
        )
    }
}