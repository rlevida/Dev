import React from "react";
import { connect } from "react-redux";
import Form from "./form";

@connect(({ task }) => {
    return {
        task
    }
})

export default class TaskComment extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <Form />
        )
    }
}