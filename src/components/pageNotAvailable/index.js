import React from "react";
import Header from "../partial/header";

export default class Component extends React.Component {
    constructor(props){
        super(props)
    }

    render() {
        var Component =  <div id="content">
            <div>
                <h1>Page not available</h1>
            </div>
        </div>
        return (
            <Header component={Component} page={"Dashboard"} />
        )
    }
}