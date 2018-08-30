import React from "react";
import { connect } from "react-redux"
import { DragSource } from 'react-dnd';
import { DropTarget } from 'react-dnd';

const itemSource = {
    beginDrag(props){
        return props.data;
    },
    endDrag(props,monitor,component){
        return props.handleDrop(props.data.id)
    }
    
}

const itemTarget = {
	canDrop() {
		return false
	},

	hover(props, monitor) {
        const data = monitor.getItem()
            if(data.id != props.data.id  && typeof props.data.isFolder != "undefined"){
                if(data.docType == "folder"){
                    props.documentToMove({ ...data , parentId : props.data.id })
                }else{
                    props.documentToMove({ ...data , folderId : props.data.id })
                }

            }else{
                props.documentToMove({})
            }
	},
}

@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
        loggedUser: store.loggedUser,
        workstream: store.workstream,
        users : store.users,
        settings: store.settings,
        starred : store.starred,
        global : store.global,
        task : store.task,
        projectData : store.project,
        folder : store.folder

    }
})

@DropTarget("item", itemTarget, connect => ({
	connectDropTarget: connect.dropTarget(),
}))

@DragSource("item", itemSource, (connect, monitor) => ({
	connectDragSource: connect.dragSource(),
	isDragging: monitor.isDragging(),
}))

export default class LibraryDocument extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        const { isDragging , connectDragSource , connectDropTarget , item , data , docType , key } = this.props;
        const opacity = isDragging ? 0 : 1;
       
        let { document , workstream , settings , starred , global , task , folder , dispatch } = this.props;
        let documentList = { newUpload : [] , library : [] } , tagList = [] , tagOptions = [] ;

            workstream.List.map( e => { tagOptions.push({ id: `workstream-${e.id}`, name: e.workstream })})
            task.List.map( e => { tagOptions.push({ id: `task-${e.id}` , name: e.task })})

            if( document.List.length > 0 ){
                document.List.filter( e =>{
                    if( e.status == "new" && e.isCompleted != 1 ){
                        documentList.newUpload.push(e)
                    }
                    if( e.status == "library" && e.isCompleted != 1 ){
                        documentList.library.push(e)
                    }
                })
            }

            if(typeof global.SelectList.tagList != "undefined"){
                global.SelectList.tagList.map( t => {
                    if(workstream.List.filter( w => { return w.id == t.linkId && t.linkType == "workstream"} ).length > 0 ){
                        let workstreamName =  workstream.List.filter( w => { return w.id == t.linkId})[0].workstream;
                            tagList.push({ linkType: t.linkType , tagTypeId: t.tagTypeId  , name : workstreamName , linkId : t.linkId });
                    }
                    if(task.List.filter( w => { return w.id == t.linkId && t.linkType == "task"} ).length > 0){
                        let taskName =  task.List.filter( w => { return w.id == t.linkId})[0].task;
                            tagList.push({ linkType: t.linkType , tagTypeId: t.tagTypeId  , name : taskName , linkId : t.linkId });
                    }
                })
            }

        if(docType == "folder"){
            return  connectDragSource( 
                        connectDropTarget(
                            <tr style={{opacity}}>
                                <td><input type="checkbox"/></td>
                                <td><span class="glyphicon glyphicon-star-empty"  onClick={()=> this.starDocument( data , 0 )} style={{ cursor:"pointer" }}></span></td>
                                <td><a href="javascript:void(0)" onClick={()=> dispatch({type:"SET_FOLDER_SELECTED" , Selected : data })}><span class="fa fa-folder" style={{marginRight:"20px"}}></span>{data.name}</a></td>
                                <td>{moment(data.dateUpdated).format('L')}</td>
                            </tr>
                        )
                    )
        }else{
            return  connectDragSource( 
                connectDropTarget(
                    <tr key={key} style={{ opacity }}>
                        <td> 
                            <input type="checkbox" 
                                // onChange={ () => this.handleIsCompleted(data , data.isCompleted ) } checked={ data.isCompleted }
                            />
                        </td>
                        <td> 
                            {
                                starred.List.filter( s => { return s.linkId == data.id }).length > 0 
                                    ? <span class="glyphicon glyphicon-star" onClick={()=> this.starDocument( data , 1 )} style={{ cursor:"pointer" }}></span>
                                        : <span class="glyphicon glyphicon-star-empty"  onClick={()=> this.starDocument( data , 0 )} style={{ cursor:"pointer" }}></span> 
                            }
                        </td>
                        <td><a href="javascript:void(0)" onClick={()=> this.viewDocument(data) }><span class="glyphicon glyphicon-file"></span>{ data.origin }</a></td>
                            <td>{ moment(data.dateUpdated).format('L') }</td>
                            <td><i class="fa fa-users"></i></td>
                            <td> 
                                { (tagList.length > 0) &&
                                    tagList.map((t,tIndex) =>{
                                        if(t.tagTypeId == data.id){
                                            return <span key={tIndex} class="label label-primary" style={{margin:"5px"}}>{t.name}</span>
                                        }
                                    })
                                }
                            </td>
                            <td>
                                <div class="dropdown">
                                    <button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu2" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">&#8226;&#8226;&#8226;</button>
                                    <ul class="dropdown-menu  pull-right" aria-labelledby="dropdownMenu2">
                                        <li><a href="javascript:void(0)" onClick={()=> this.viewDocument(data)}>View</a></li>
                                        <li><a href="javascript:void(0)" data-tip="Edit" onClick={()=> this.editDocument( data , "tags" , tagList )}>Edit Tags</a></li>
                                        <li><a href={ settings.imageUrl + "/upload/" + data.name } data-tip="Download">Download</a></li>
                                        <li>
                                        {
                                            starred.List.filter( s => { return s.linkId == data.id }).length > 0 
                                                ? <a href="javascript:void(0)" data-tip="Unstarred" onClick={()=> this.starDocument( data , 1)}>Unstarred</a>
                                                    :  <a href="javascript:void(0)" data-tip="Star" onClick={()=> this.starDocument( data , 0 )}>Star</a>
                                        }
                                        </li>
                                        <li><a href="javascript:void(0);" data-tip="Delete" onClick={e => this.deleteDocument(data.id)}>Delete</a></li>
                                        <li><a href={ settings.imageUrl + "/upload/" + data.name } data-tip="Print">Print</a></li>
                                    </ul>
                                </div>
                            </td>
                        </tr>
                )
            )
        }
    }
}