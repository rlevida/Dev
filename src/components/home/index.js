import React from "react";
import ReactDOM from "react-dom";

import Header from "../partial/header";

import ProjectStatus from "../project/projectStatus"

export default class Component extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            page: page
        }
    }

    render() {
        var Component =  <div id="content">
                <div>
                    <h4>Project</h4>
                    <ProjectStatus style={{}} />
                </div>
        </div>
        return (
            <Header component={Component} page={"Dashboard"} />
        )
    }
}