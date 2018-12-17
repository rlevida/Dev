import React from "react";
import { connect } from "react-redux";

@connect((store) => {
    return {
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
                        List</a></li>|
                <li class="list-inline-item" style={{ color: "gray" }}><a href="javascript:void(0)"
                        onClick={() => {
                            dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "Timeline" })
                            dispatch({ type: "SET_TASK_SELECTED", Selected: {} })
                        }}>Timeline</a></li>|
                <li class="list-inline-item" style={{ color: "gray" }}><a href="javascript:void(0)"
                        onClick={() => {
                            dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "Calendar" })
                            dispatch({ type: "SET_TASK_SELECTED", Selected: {} })
                        }}>Calendar</a></li>
                </ul>
            </div>
        );
    }
}