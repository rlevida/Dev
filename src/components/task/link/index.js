import React from "react";
import { connect } from "react-redux";

@connect((store) => {
    return {
        socket: store.socket.container,
        task: store.task,
    }
})

export default class Link extends React.Component {
    render() {
        let { dispatch } = this.props;
        return (
            <div>
                <ul class="list-inline mb0">
                    <li class="list-inline-item"><a href="javascript:void(0)"
                        onClick={() => {
                            dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "List" })
                            dispatch({ type: "SET_TASK_SELECTED", Selected: {} })
                        }}>
                        List</a>&nbsp;&nbsp;</li>|
                <li class="list-inline-item" style={{ color: "gray" }}>Timeline&nbsp;&nbsp;</li>|
                <li class="list-inline-item" style={{ color: "gray" }}>Calendar&nbsp;&nbsp;</li>
                </ul>
            </div>
        );
    }
}