import React from "react"
import Comment from "./comment"
import Notification from "./notification"
export default class Socket extends React.Component {
    render() {
        return (
            <div>
                <Comment />
                <Notification />
            </div>
        )
    }
}