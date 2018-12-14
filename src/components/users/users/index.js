import React from "react"

import List from "./list"

import { connect } from "react-redux"
@connect((store) => {
    return {
        users: store.users,
        loggedUser: store.loggedUser
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        let { users } = this.props

        return (
            <div>
                {users.FormActive == "List" &&
                    <List />
                }

            </div>
        )
    }
}