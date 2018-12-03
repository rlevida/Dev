import React from "react"
import { connect } from "react-redux"
import List from "../../conversations/list"
import Form from "../../conversations/form"
import { putData, showToast } from "../../../globalFunction";

@connect((store) => {
    return {
        socket: store.socket.container,
        notes: store.notes,
        workstream: store.workstream,
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
        let { notes, workstream } = this.props;
        return (
            <div class="pd20">   
                <div class="panel panel-default">
                    <div class="panel-body">
                        <div style={{paddingRight:"0px"}} className={ notes.FormActive == "View" ? "col-lg-6 col-md-6 col-sm-12"  : "col-lg-12 col-md-12 col-sm-12"}>
                            <List setIsClosed={this.setIsClosed} updateSelectedNotes={this.updateSelectedNotes} workstreamId={workstream.Selected.id} />
                        </div>
                        { (notes.FormActive == "View") &&
                            <div style={{paddingLeft:"0px"}} class="col-lg-6 col-md-6 col-sm-12">
                                <Form setIsClosed={this.setIsClosed} updateSelectedNotes={this.updateSelectedNotes} />
                            </div>
                        }
                    </div>
                </div>
            </div>
        )
    }
}