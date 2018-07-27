import React from "react"

import { showToast } from '../../globalFunction'
import { HeaderButtonContainer, DropDown } from "../../globalComponents"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        workstream: store.workstream,
        loggedUser: store.loggedUser,
        status: store.status,
        type: store.type
    }
})

export default class FormComponent extends React.Component {
    constructor(props) {
        super(props)

        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
        this.setDropDown = this.setDropDown.bind(this)
    }

    componentDidMount() {
        $(".form-container").validator();
    }

    handleChange(e) {
        let { socket, dispatch, workstream } = this.props
        let Selected = Object.assign({}, workstream.Selected)
        Selected[e.target.name] = e.target.value;
        dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: Selected })
    }

    handleSubmit(e) {
        let { socket, workstream } = this.props

        let result = true;
        $('.form-container *').validator('validate');
        $('.form-container .form-group').each(function () {
            if ($(this).hasClass('has-error')) {
                result = false;
            }
        });
        if (!result) {
            showToast("error", "Form did not fullfill the required value.")
            return;
        }
        
        socket.emit("SAVE_OR_UPDATE_WORKSTREAM", { data: { ...workstream.Selected, projectId: project, numberOfHours: (workstream.Selected.typeId == 5) ? workstream.Selected.numberOfHours : 0 } });
    }

    setDropDown(name, value) {
        let { socket, dispatch, workstream } = this.props
        let Selected = Object.assign({}, workstream.Selected)
        Selected[name] = value;
        dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: Selected })
    }

    setDropDownMultiple(name, values) {
        this.setState({
            [name]: JSON.stringify(values ? values : [])
        });
    }

    render() {
        let { dispatch, workstream, loggedUser, status, type } = this.props
        let statusList = [], typeList = []
        status.List.map((e, i) => { if (e.linkType == "workstream") { statusList.push({ id: e.id, name: e.status }) } })
        type.List.map((e, i) => { if (e.linkType == "workstream") { typeList.push({ id: e.id, name: e.type }) } })

        return <div>
            <HeaderButtonContainer withMargin={true}>
                <li class="btn btn-info" style={{ marginRight: "2px" }}
                    onClick={(e) => {
                        dispatch({ type: "SET_WORKSTREAM_FORM_ACTIVE", FormActive: "List" });
                        dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: {} });
                    }} >
                    <span>Back</span>
                </li>
                <li class="btn btn-info" onClick={this.handleSubmit} >
                    <span>Save</span>
                </li>
            </HeaderButtonContainer>
            <div class="row mt10">
                <div class="col-lg-12 col-md-12 col-xs-12">
                    <div class="panel panel-default">
                        <div class="panel-heading">
                            <h3 class="panel-title">Workstream {(workstream.Selected.id) ? " > Edit > ID: " + workstream.Selected.id : " > Add"}</h3>
                        </div>
                        <div class="panel-body">
                            <form onSubmit={this.handleSubmit} class="form-horizontal form-container">
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Status</label>
                                    <div class="col-md-7 col-xs-12">
                                        <DropDown multiple={false}
                                            required={false}
                                            options={statusList}
                                            selected={(typeof workstream.Selected.statusId == "undefined") ? "" : workstream.Selected.statusId}
                                            onChange={(e) => this.setDropDown("statusId", e.value)} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Workstream *</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="text" name="workstream" required value={(typeof workstream.Selected.workstream == "undefined") ? "" : workstream.Selected.workstream} class="form-control" placeholder="Workstream" onChange={this.handleChange} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Type</label>
                                    <div class="col-md-7 col-xs-12">
                                        <DropDown multiple={false}
                                            required={false}
                                            options={typeList}
                                            selected={(typeof workstream.Selected.typeId == "undefined") ? "" : workstream.Selected.typeId}
                                            onChange={(e) => {
                                                this.setDropDown("typeId", e.value);
                                            }} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                {
                                    (typeof workstream.Selected.typeId != "undefined" && workstream.Selected.typeId == 5) && <div class="form-group">
                                        <label class="col-md-3 col-xs-12 control-label">Number of Hours</label>
                                        <div class="col-md-7 col-xs-12">
                                            <input type="number" name="numberOfHours" required value={(typeof workstream.Selected.numberOfHours == "undefined") ? "" : workstream.Selected.numberOfHours} class="form-control" placeholder="Number of Hours" onChange={this.handleChange} />
                                            <div class="help-block with-errors"></div>
                                        </div>
                                    </div>
                                }
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Project Name *</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="text" name="projectName" required value={(typeof workstream.Selected.projectName == "undefined") ? "" : workstream.Selected.projectName} class="form-control" placeholder="Project Name" onChange={this.handleChange} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Project Description</label>
                                    <div class="col-md-7 col-xs-12">
                                        <textarea name="projectDescription" value={(typeof workstream.Selected.projectDescription == "undefined") ? "" : workstream.Selected.projectDescription} class="form-control" placeholder="Project Description" onChange={this.handleChange} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
}