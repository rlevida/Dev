import React from "react";
import { connect } from "react-redux";
import Form from "./form";
import List from "./list";

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
            <div>
                <List />
                <Form />
            </div>
        )
    }
}