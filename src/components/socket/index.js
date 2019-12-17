import React from "react";
import Login from "./login";
import Comment from "./comment";
import Notification from "./notification";
export default class Socket extends React.Component {
    render() {
        return (
            <div>
                <Login />
                <Comment />
                <Notification />
            </div>
        )
    }
}