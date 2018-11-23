import React from "react";
import _ from 'lodash';
import { connect } from "react-redux";
import { DropDown } from "../../globalComponents";
import { postData, showToast } from "../../globalFunction";

@connect((store) => {
    return {
        socket: store.socket.container,
        notes: store.notes,
    }
})

export default class NewForm extends React.Component {
    constructor(props){
        super(props)

        this.state = {
            data: {
                note: "",
                tag: [],
                privacyType: "public",
                projectId: project
            }
        }

        this.handleSubmit = this.handleSubmit.bind(this)
    }

    handleSubmit(e) {
        const { notes, dispatch } = this.props;
        let result = true;
        $('.form-container *').validator('validate');
        $('.form-container .form-group').each(function () {
            if ($(this).hasClass('has-error')) {
                result = false;
            }
        });

        if( !result ){
            showToast("error", "Please fill-up required field.");
            return;
        }
        
        postData(`/api/conversation`, this.state.data, (c) => {
            if (c.status == 200) {
                console.log("your data",c.data);
                let data = c.data[0];
                let list = notes.List;
                this.setState({data: {
                    note: "",
                    tag: [],
                    privacyType: "public",
                    projectId: project
                }})
                data.tag = [];
                data.comments = [];
                list.push(data);
                dispatch({ type: "SET_NOTES_LIST", list: list });
                $("#NewNoteModal").modal("hide")
                showToast("success", "Notes successfully added.");
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        })
    }

    render() {
        const { data } = this.state

        return (
            <div class="modal fade" id="NewNoteModal" tabIndex="-1" role="dialog" aria-labelledby="printerModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>New Notes</h3>
                        </div>
                        <div class="modal-body row">
                            <form>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Note *</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="text" name="task" required value={data.note} onChange={e=> { this.state.data.note = e.target.value; this.setState({data:this.state.data})} } />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Privacy Type</label>
                                    <div class="col-md-7 col-xs-12">
                                        <DropDown multiple={false}
                                            options={[{id:"public",name:"public"},{id:"private",name:"private"}]}
                                            selected={data.privacyType}
                                            onChange={e=> { this.state.data.privacyType = e.value; this.setState({privacyType:this.state.data})} }
                                        />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onClick={ () => this.handleSubmit() }>Save</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}