import React from "react"
import { connect } from "react-redux"
import Header from "../partial/header"
import List from "./list"

@connect((store) => {
    return {
        reminder: store.reminder
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props) 
    }

    render() {
        let { reminder } = this.props
        let Component = <div>
                {reminder.FormActive == "List" &&
                    <List />
                }
            </div>
        return (
            <Header component={Component} page={"document"} />
        )
    }
}