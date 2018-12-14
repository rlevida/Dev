import React from "react";
import { getData, showToast, deleteData } from '../../globalFunction';
import { HeaderButtonContainer, Loading } from "../../globalComponents";
import moment from 'moment'

import { connect } from "react-redux"
@connect((store) => {
    return {
        document: store.document,
        loggedUser: store.loggedUser,
        users: store.users,
        starred: store.starred,
        global: store.global,
        workstream: store.workstream
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            tempData: [],
            order: 'asc'
        }
        this.fetchData = this.fetchData.bind(this)
    }

    componentWillMount() {
        this.fetchData(1)
    }

    fetchData(page) {
        const { dispatch, loggedUser, document } = this.props;
        getData(`/api/document?linkId=${project}&linkType=project&page=${page}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&status=archived&isDeleted=0&starredUser=${loggedUser.data.id}`, {}, (c) => {
            if (c.status == 200) {
                dispatch({ type: "SET_DOCUMENT_LIST", list: document.Trash.concat(c.data.result), Count: { Count: c.data.count }, DocumentType: 'Trash', CountType: 'TrashCount' })
                dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "", LoadingType: 'TrashDocumentLoading' })
                showToast('success', 'Documents successfully retrieved.')
            } else {
                dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "", LoadingType: 'TrashDocumentLoading' })
                showToast('error', 'Something went wrong!')
            }
        });
    }

    deleteDocument(data) {
        const { dispatch } = this.props;
        if (confirm("Do you really want to delete this record?")) {
            deleteData(`/api/document/${data.id}`, {}, (c) => {
                dispatch({ type: "REMOVE_DOCUMENT_FROM_LIST", UpdatedData: data, Status: 'trash' })
                showToast('success', 'Documents successfully deleted.')
            })
        }
    }

    getNextResult() {
        const { document } = this.props;
        this.fetchData(document.TrashCount.Count.current_page + 1)
    }

    sortDocument(type) {
        const { dispatch, document } = this.props;
        const { order } = this.state;
        if (document.Trash.length > 0) {
            const sortedDocument = _.orderBy(document.Trash, [`${type}`], [`${order == 'asc' ? 'desc' : 'asc'}`]).map((e) => { return e })
            this.setState({
                ...this.state,
                order: order == 'asc' ? 'desc' : 'asc'
            })
            dispatch({ type: 'SET_DOCUMENT_LIST', list: sortedDocument, DocumentType: 'Trash', Count: document.TrashCount, CountType: 'TrashCount' })
        }
    }

    render() {
        const { document, dispatch, users, starred } = this.props;
        const currentPage = (typeof document.TrashCount.Count.current_page != "undefined") ? document.TrashCount.Count.current_page : 1;
        const lastPage = (typeof document.TrashCount.Count.last_page != "undefined") ? document.TrashCount.Count.last_page : 1;

        let tagCount = 0

        return <div>
            <HeaderButtonContainer withMargin={true}>
                <li class="btn btn-info" onClick={(e) => dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "Form" })} >
                    <span>New Document</span>
                </li>
            </HeaderButtonContainer>
            <table id="dataTable" class="table responsive-table table-bordered document-table">
                <tbody>
                    <tr>
                        <th></th>
                        <th></th>
                        <th><a href="javascript:void(0)" onClick={() => this.sortDocument('origin')}>Name</a></th>
                        <th><a href="javascript:void(0)" onClick={() => this.sortDocument('dateUpdated')}>Uploaded</a></th>
                        <th>By</th>
                        <th>Tags</th>
                        <th></th>
                    </tr>
                    {
                        document.Trash.map((data, index) => {
                            return <tr key={index}>
                                <td> <input type="checkbox" /></td>
                                <td>
                                    <span class={`fa ${data.isStarred ? "fa-star" : "fa-star-o"}`} />
                                </td>
                                <td>{data.origin}</td>
                                <td>
                                    {moment(data.dateAdded).format('L')}
                                </td>
                                <td>{data.user.emailAddress}</td>
                                <td>
                                    {(data.tags.length > 0) &&
                                        data.tags.map((t, tIndex) => {
                                            tagCount += t.label.length
                                            let tempCount = tagCount;
                                            if (tagCount > 16) { tagCount = 0 }
                                            return <span key={tIndex} ><label class="label label-primary" style={{ margin: "5px" }}>{t.label}</label>{tempCount > 16 && <br />}</span>
                                        })
                                    }
                                </td>
                                <td>
                                    <div class="dropdown">
                                        <button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu2" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">&#8226;&#8226;&#8226;</button>
                                        <ul class="dropdown-menu  pull-right" aria-labelledby="dropdownMenu2">
                                            <li><a href="javascript:void(0);" data-tip="Delete" onClick={e => this.deleteDocument(data)}>Delete</a></li>
                                        </ul>
                                    </div>
                                </td>
                            </tr>
                        })
                    }
                </tbody>
            </table>

            <div class="text-center">
                {
                    ((currentPage != lastPage) && document.Trash.length > 0 && document.TrashDocumentLoading != "RETRIEVING") && <a onClick={() => this.getNextResult()}>Load More Documents</a>
                }
                {
                    (document.Trash.length == 0 && document.TrashDocumentLoading != "RETRIEVING") && <p>No Records Found</p>
                }
            </div>
            {
                (document.TrashDocumentLoading == "RETRIEVING") && <Loading />
            }
        </div >
    }
}