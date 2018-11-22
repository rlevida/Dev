import React from "react";
import Header from "../partial/header";
import ProjectStatus from "../project/projectStatus"

export default class Component extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            page: page
        }
    }

    render() {
        var Component = <div class="pd20">
            <h4>Projects</h4>
            <div class="row mb10">
                <div class="col-lg-10">
                    <ProjectStatus offset={false}/>
                </div>
            </div>
        </div>
        return (
            <Header component={Component} page={"My Dashboard"} />
        )
    }
}