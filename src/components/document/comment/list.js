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
            <div class="row mt20">
                {
                    _.map(conversation.List, (o, index) => {
                        return (
                            <div class="col-md-12" key={index} >
                                <div class="ml15">
                                    <MentionConvert string={o.comment} />
                                    <p style={{ marginTop: 5, fontSize: 10 }}>
                                        By: {o.users.firstName + ' ' + o.users.lastName + " - " + moment(o.dateAdded).format("MMM DD, YYYY")}
                                    </p>
                                </div>
                            </div>
                        )
                    })
                }
            </div>
        )
    }
}