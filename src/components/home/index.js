import React from "react";
import ReactDOM from "react-dom";

import Header from "../partial/header";
import { showToast } from '../../globalFunction';

export default class Component extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            page: page
        }
    }

    render() {
        var Component =  <div id="content"></div>
        return (
            <Header component={<p></p>} page={"Dashboard"} />
        )
    }
}