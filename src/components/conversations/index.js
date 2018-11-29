import React from "react"
import { connect } from "react-redux"
import List from "./list"
import Form from "./form"
import Header from "../partial/header"
import { putData, showToast } from "../../globalFunction";

@connect((store) => {
    return {
        socket: store.socket.container,
        notes: store.notes,
        projectData: store.project,
        loggedUser: store.loggedUser
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props)
        this.setIsClosed = this.setIsClosed.bind(this);
        this.updateSelectedNotes = this.updateSelectedNotes.bind(this);
    }

    setIsClosed(isClosed,data) {
        const { notes, dispatch } = this.props;
        putData(`/api/conversation/${data.id}`, { isClosed }, (c) => {
            if (c.status == 200) {
                const dataIndex = notes.List.indexOf(data);
                const newData = data;
                newData.isClosed = c.data[0].isClosed;
                notes.List.splice(dataIndex, 1, newData);
                this.updateSelectedNotes(newData);
                dispatch({ type: "SET_NOTES_LIST", list: notes.List });
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });
    }

    updateSelectedNotes(data){
        const { notes, dispatch } = { ...this.props };
        if( data.id === notes.Selected.id ){
            dispatch({ type: "SET_NOTES_SELECTED", Selected: data });
        }
    }

    render() {
        let { notes, projectData } = this.props;
        const Component = <div class="pd20">   
                <h3 class="mt10 mb10"><a href={"/project/" + project} style={{ color: "#000", textDecortion: "none" }}>{projectData.Selected.project}</a></h3>
                {/* <div>
                    <ul class="list-inline mb0">
                        <li class="list-inline-item"><a href="javascript:void(0)"
                            onClick={() => {
                                dispatch({ type: "SET_NOTES_FORM_ACTIVE", FormActive: "List" })
                                dispatch({ type: "SET_NOTES_SELECTED", Selected: {} })
                            }}>
                            All</a>&nbsp;&nbsp;</li>|
                    <li class="list-inline-item" style={{ color: "gray" }}><a href="javascript:void(0)"
                            onClick={() => {
                                dispatch({ type: "SET_NOTES_FORM_ACTIVE", FormActive: "Timeline" })
                                dispatch({ type: "SET_NOTES_SELECTED", Selected: {} })
                            }}>Filter</a>&nbsp;&nbsp;</li>
                    </ul>
                </div>
                <br /> */}
                <div class="panel panel-default">
                    <div class="panel-body">
                        <div style={{paddingRight:"0px"}} className={ notes.FormActive == "View" ? "col-lg-6 col-md-6 col-sm-12"  : "col-lg-12 col-md-12 col-sm-12"}>
                            <List setIsClosed={this.setIsClosed} updateSelectedNotes={this.updateSelectedNotes} />
                        </div>
                        { (notes.FormActive == "View") &&
                            <div style={{paddingLeft:"0px"}} class="col-lg-6 col-md-6 col-sm-12">
                                <Form setIsClosed={this.setIsClosed} updateSelectedNotes={this.updateSelectedNotes} />
                            </div>
                        }
                    </div>
                </div>
            </div>
        return (
            <Header component={Component} page={"Conversations"} />
        )
    }
}