import React from "react"

import Header from "../partial/header"
import MyTaskList from "./myTaskList"

import { connect } from "react-redux"
@connect((store) => {
    return {
        task: store.task,
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { task } = this.props;
        const component = <div>
            {task.FormActive == "List" && 
                <MyTaskList />
            }
        </div>
        return (
            <Header component={component} page={"My Tasks"} />
        )
    }
}