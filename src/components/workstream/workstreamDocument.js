import React from "react";
import { connect } from "react-redux";
import { Link } from 'react-router-dom';
import _ from "lodash";
import EditModal from '../document/modal/editModal'
import { showToast, getData, displayDateMD } from '../../globalFunction';
import { Loading } from "../../globalComponents";
import { withRouter } from "react-router";

@connect((store) => {
    return {
        project: store.project,
        loggedUser: store.loggedUser,
        workstream: store.workstream,
        document: store.document
    }
})

class DocumentList extends React.Component {
    constructor(props) {
        super(props);
    }

    componentWillUnmount() {
        const { dispatch } = { ...this.props };
        dispatch({ type: 'CLEAR_DOCUMENT' });
    }

    componentDidMount() {
        this.fetchData(1)
    }

    fetchData(page) {
        const { dispatch, loggedUser, document, workstream, project, workstream_id } = this.props;
        getData(`/api/document/getTaggedDocument?isDeleted=0&projectId=${project.Selected.id}&linkType=workstream&page=${page}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&workstreamId=${workstream_id}&tagType=document&starredUser=${loggedUser.data.id}&type=document`, {}, (c) => {
            dispatch({ type: "SET_DOCUMENT_LIST", list: document.List.concat(c.data.result), DocumentType: 'List', Count: c.data.count, CountType: 'Count' })
            dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "", LoadingType: 'Loading' })
        });
    }

    editDocument(data, type) {
        const { dispatch } = this.props;
        const newData = { ...data, workstreamId: data.tagWorkstream };
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: { ..._.omit(newData, ['status']), oldDocument: type === 'tags' ? data.tagWorkstream.map((e) => { return e.label }).join(',') : newData.origin } });
        dispatch({ type: "SET_DOCUMENT_EDIT_TYPE", EditType: type });
        $(`#editModal`).modal('show');
    }

    downloadDocument(data) {
        if (data.type === 'document') {
            window.open(encodeURI(`/api/downloadDocument?fileName=${data.name}&origin=${data.origin}`));
        } else {
            window.open(encodeURI(`/api/downloadFolder?folder=${data.id}&folderName=${`${data.origin}${data.documentNameCount > 0 ? `(${data.documentNameCount})` : ``}`}`));
        }
    }

    gotoFolder(data) {
        const { history, project } = { ...this.props };
        if (data.document_folder) {
            history.push(`/projects/${project.Selected.id}/files?id=${data.folderId}&folder=${data.document_folder.origin}&status=${data.document_folder.status}`);
        } else {
            history.push(`/projects/${project.Selected.id}/files`)
        }
    }

    render() {
        const { workstream, dispatch, document, project, loggedUser } = { ...this.props };

        // const typeValue = (typeof workstream.Selected.workstream != "undefined" && _.isEmpty(workstream.Selected) == false) ? workstream.Selected.workstream : "";
        return (
            <div>
                <div class="row">
                    <div class="col-lg-12">
                        <table class="table-document mb40">
                            <tbody>
                                <tr>
                                    <th style={{ width: '5%' }}></th>
                                    <th style={{ textAlign: 'left' }}>File Name</th>
                                    <th>Uploaded By</th>
                                    <th>Uploaded Date</th>
                                    <th>Workstream</th>
                                    <th>Read On</th>
                                    {/* <th>Actions</th> */}
                                </tr>
                                {(document.Loading != "RETRIEVING") &&
                                    document.List.map((data, index) => {
                                        let tagCount = 0;
                                        const documentName = `${data.origin}${data.documentNameCount > 0 ? `(${data.documentNameCount})` : ``}`
                                        return (
                                            <tr class="item" key={index}>
                                                <td><span class={`fa ${data.isStarred ? "fa-star" : "fa-star-o"}`} /></td>
                                                <td class="document-name">
                                                    {data.type === "document" ?
                                                        <Link to={`/projects/${project.Selected.id}/files/${data.id}`}>{documentName}</Link>
                                                        :
                                                        <a href="javascript:void(0)" onClick={() => this.viewDocument(data)}>
                                                            {data.type === "document" ?
                                                                <span class="mr10" style={{ fontSize: '18px' }}>&bull;</span> :
                                                                <span class="mr10 fa fa-folder fa-lg"></span>
                                                            }
                                                        </a>
                                                    }
                                                </td>
                                                <td class="avatar"><img src="/images/user.png" title={`${data.user.emailAddress}`} /></td>
                                                <td>{displayDateMD(data.dateAdded)}</td>
                                                <td>{
                                                    data.tagWorkstream.length > 0 &&
                                                    data.tagWorkstream.map((t, tIndex) => {
                                                        tagCount += t.label.length
                                                        let tempCount = tagCount;
                                                        if (tagCount > 16) { tagCount = 0 }
                                                        return <span key={tIndex} ><label class="label label-primary" style={{ margin: "5px" }}>{t.label}</label>{tempCount > 16 && <br />}</span>
                                                    })
                                                }
                                                </td>
                                                <td>{data.readOn ? displayDateMD(data.readOn) : '--'}</td>
                                                <td style={{ display: 'flex' }}>
                                                    <div class="dropdown document-action-more">
                                                        <button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu2" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">&#8226;&#8226;&#8226;</button>
                                                        <ul class="dropdown-menu  pull-right" aria-labelledby="dropdownMenu2">
                                                            <li><a href="javascript:void(0)" data-tip="Edit" onClick={() => this.downloadDocument(data)}>Download</a></li>
                                                            <li><a href="javascript:void(0)" data-tip="Edit" onClick={() => this.editDocument(data, "rename")}>Rename</a></li>
                                                            {/* <li><a href="javascript:void(0)" data-tip="Edit" onClick={() => this.editDocument(data, "tags")}>Edit Tags</a></li> */}
                                                            <li><a href="javascript:void(0)" data-tip="View" onClick={() => this.gotoFolder(data)}>Goto folder</a></li>
                                                        </ul>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
                <EditModal />
            </div>
        )
    }
}

export default withRouter(DocumentList);