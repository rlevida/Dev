import React from "react";
import { DropDown } from "../../globalComponents";
import Dropzone from 'react-dropzone';
import DocumentStatus from "./documentStatus"
import DocumentNew from "./documentNew"
import DocumentLibrary from "./documentLibrary"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
        loggedUser: store.loggedUser,
        workstream: store.workstream,
        settings: store.settings,
        starred : store.starred,
        global : store.global,
        task : store.task,
        projectData : store.project

    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            tempData : [] , 
            upload : false,
            loading : false,
            tags : [],
            files : []
        }
        this.onDrop = this.onDrop.bind(this)
    }

    componentWillMount() {
        let { socket , loggedUser } = this.props
            socket.emit("GET_SETTINGS", {});
            socket.emit("GET_USER_LIST",{});
            socket.emit("GET_FOLDER_LIST", { filter: { projectId: project }})
            socket.emit("GET_TASK_LIST", { filter: { projectId: project }});
            socket.emit("GET_STARRED_LIST", { filter : { linkType : "project" } })
            socket.emit("GET_WORKSTREAM_LIST", { filter : { projectId : project } });
            socket.emit("GET_DOCUMENT_LIST", { filter : { isDeleted : 0 , linkId : project , linkType : "project" , userTypeLinkId : loggedUser.data.id }});

            // SELECT LIST
            
            socket.emit("GET_APPLICATION_SELECT_LIST",{ selectName : "shareList" , filter : { linkType: "project" , linkId : project } })
            socket.emit("GET_APPLICATION_SELECT_LIST",{ selectName : "ProjectMemberList" , filter : { linkId : project, linkType: "project" } })
    }

    saveDocument(){
        let { socket , loggedUser } = this.props;
        let { tempData , tags } = this.state;
            socket.emit("SAVE_OR_UPDATE_DOCUMENT", { 
                data: tempData , userId : loggedUser.data.id, project: project, tags: JSON.stringify(tags) 
            });
            this.setState({  upload : false ,   tempData : [] , tags : [] });
    }

    selectTag(e , index){
        let { tempData }  = this.state;
            tempData[index].tags = JSON.stringify(e);
            tempData[index].status = "new";
            this.setState({ tempData : tempData });
    }

    onDrop(files){
        this.setState({ files  , upload : true });
    }

    uploadFile(){
        let { loggedUser } = this.props,
            { files } = this.state
        let data = new FormData() , tempData = [] , self = this

            this.setState({ loading : true })

            files.map( e =>{
                data.append("file",e)
            } )

            $.ajax({
                url: '/api/upload?uploadType=form&type=upload',
                type: 'post',
                dataType: 'json',
                data: data,
                processData: false,
                contentType: false,
                success: function(res) {   
                    res.files.map( e =>{
                        tempData.push({ name: e.filename, origin: e.origin , project: project ,uploadedBy : loggedUser.data.id , status : "new" })
                    })
                    self.setState({ tempData : tempData , loading : false , upload : false })
                }
            });
    }

    render() {
        let { workstream  , task , dispatch , projectData } = this.props;
        let tagOptions = [] ;

            workstream.List.map( e => { tagOptions.push({ id: `workstream-${e.id}`, name: e.workstream })})
            task.List.map( e => { tagOptions.push({ id: `task-${e.id}` , name: e.task })})

        return <div>
                <h3>&nbsp;&nbsp;&nbsp;&nbsp;<a href={"/project/"+project} style={{color:"#000",textDecortion:"none"}}>{projectData.Selected.project}</a></h3>
                <div style={{paddingBottom:"50px",paddingRight:"20px"}}>
                    <div class="form-group">
                        <button type="button" class="btn btn-primary pull-right" data-toggle="modal" data-target="#uploadFileModal" >
                            Upload Files &nbsp; <i class="fa fa-caret-down"></i>
                        </button>
                        <input class="form-control pull-right" type="text" placeholder="Search" aria-label="Search" style={{width:"200px",marginRight:"50px"}}/>
                    </div>
                </div>
                <div style={{padding:"20px"}}>
                    <div class="row"> 
                        <DocumentStatus/>
                        <DocumentNew/>
                        <DocumentLibrary/>
                    </div>
                </div>

                <div class="modal fade" id="uploadFileModal" tabIndex="-1" role="dialog" aria-labelledby="uploadFileModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                                <h5 class="modal-title" id="uploadFileModalLabel">
                                { 
                                        (this.state.tempData.length == 0) 
                                            ?  "Upload File"
                                            : "Tag your files"
                                }
                                </h5>
                                { (this.state.tempData.length > 0) && 
                                    <p style={{fontStyle:"italic", margin:"15px 20px 20px 25px"}}>Tagging your files will link them to a project or workflow and will make it easier to find them later.</p>
                                }
                            
                            </div>
                        <div class="modal-body">
                            { (!this.state.loading && this.state.tempData.length == 0) &&
                                <Dropzone onDrop={this.onDrop.bind(this)}
                                    class="document-file-upload"
                                >
                                    <div style={{ textAlign : "center" , height: "100%" , padding: "60px"}}>
                                        <div>
                                        { ( this.state.upload  && !this.state.loading ) ?
                                            <span style={{ fontSize: "75px" }} class="glyphicon glyphicon-file"></span> : 
                                            <p>Drop some files here, or click to select files to upload.</p>
                                        }
                                        </div>
                                    </div>
                                </Dropzone>
                            }

                            <br/>

                            { ( this.state.upload  && !this.state.loading ) && 
                                <div class="form-group text-center">
                                    <button class="btn btn-success" onClick={()=> this.uploadFile()}> Upload</button>
                                </div>
                            }

                            <table id="dataTable" class="table responsive-table" >
                                <tbody>
                                {( this.state.tempData.length == 0 && this.state.loading ) &&
                                    <tr>
                                        <td colSpan={8}><i class="fa fa-spinner fa-spin" style={{ fontSize:"36px" , marginTop: "50px"}}></i></td>
                                    </tr>
                                }
                                {(this.state.tempData.length > 0) &&
                                    this.state.tempData.map((data, index) => {
                                        return  (
                                            <tr key={index}>
                                                <td style={{border:"none" , width: "20%"}}><span class="pull-left"><i class="fa fa-file" aria-hidden="true"></i>&nbsp;&nbsp;{data.origin}</span></td>
                                                <td style={{border:"none" , width: "10%"}}><span><i class="fa fa-tag" aria-hidden="true"></i></span></td>
                                                <td style={{border:"none"}}>   
                                                    <DropDown multiple={false} 
                                                        multiple={true}
                                                        required={false}
                                                        options={ tagOptions } 
                                                        selected={ ( typeof data.tags != "undefined" ) ? JSON.parse(data.tags) : []  } 
                                                        onChange={(e)=>this.selectTag(e , index)} 
                                                        /> 
                                                    <div class="help-block with-errors"></div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                }
                                </tbody>
                            </table>

                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            { ( this.state.tempData.length > 0) && 
                                <button type="button" class="btn btn-primary" data-dismiss="modal" onClick={ () => this.saveDocument() }>Save</button>
                            }
                        </div>
                        </div>
                    </div>
                </div>
            </div>
    }
}