import React from "react";
import ReactDOM from "react-dom";

import Header from "../partial/header";
import { showToast } from '../../globalFunction';
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
                <h1>Page not available</h1>
            </div>
        </div>
        return (
            <Header component={Component} page={"Dashboard"} />
        )
    }
}