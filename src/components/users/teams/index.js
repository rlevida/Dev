import React from "react"
import List from "./list"

import { connect } from "react-redux"
@connect((store) => {
    return {
        teams: store.teams,
        loggedUser: store.loggedUser
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props)
    }


    render() {
        let { teams } = this.props
        return (
            <div>
                {teams.FormActive == "List" &&
                    <List />
                }
            </div>
        )
    }
}