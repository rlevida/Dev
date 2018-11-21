import React from "react";
import moment from 'moment';
import { connect } from "react-redux";
import _ from "lodash";

import { Loading } from "../../globalComponents";

@connect((store) => {
    return {
        socket: store.socket.container,
        notes: store.notes,
        workstream: store.workstream,
        loggedUser: store.loggedUser,
        global: store.global,
        document: store.document
    }
})
export default class List extends React.Component {
    constructor(props){
        super(props)
        this.fetchNotes = this.fetchNotes.bind(this)
        this.openDetail = this.openDetail.bind(this)
    }

    componentDidMount() {
        this.fetchNotes();
    }

    fetchNotes(){
        const { dispatch } = this.props
        dispatch({type:"SET_NOTES_LOADING", Loading: "RETRIEVING"});

        setTimeout(()=>{
            let data = [
                {
                    id : 1,
                    note: "Treatment of salary deductions",
                    tag: [ ],
                    privacyType: "public",
                    isStarred: 0,
                    createdBy: [
                        {
                            id: 1,
                            firstname: "Mickael",
                            lastName: "Cardoso"
                        },
                    ],
                    comments: [
                        {
                            id: 1,
                            message: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book..",
                            users: [
                                {
                                    id: 1,
                                    firstName: "Mickael",
                                    lastName: "Cardoso"
                                }
                            ]
                        },
                        {
                            id: 2,
                            message: "@mickael this is noted",
                            users: [
                                {
                                    id: 2,
                                    firstName: "User",
                                    lastName: "2"
                                }
                            ]
                        },
                    ],
                    dateAdded: "2018/11/09 12:00.000Z",
                    dateUpdated: "2018/11/09 12:00.000Z",
                },
                {
                    id : 2,
                    note: "Note test 2",
                    tag: [
                        {
                            id: 1,
                            task: "Payroll",
                            dueDate: "2019/11/09 12:00.000Z",
                            isActive: 1
                        },
                        {
                            id: 2,
                            task: "Invoice",
                            dueDate: "2018/11/09 12:00.000Z",
                            isActive: 1
                        }
                    ],
                    privacyType: "linked",
                    isStarred: 0,
                    createdBy: [
                        {
                            id: 1,
                            firstname: "User",
                            lastName: "2"
                        },
                    ],
                    comments: [
                        {
                            id: 1,
                            message: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
                            users: [
                                {
                                    id: 1,
                                    firstName: "Mickael",
                                    lastName: "Cardoso"
                                }
                            ]
                        },
                        {
                            id: 2,
                            message: "@mickael this is noted",
                            users: [
                                {
                                    id: 2,
                                    firstName: "User",
                                    lastName: "2"
                                }
                            ]
                        },
                    ],
                    dateAdded: "2018/11/09 12:00.000Z",
                    dateUpdated: "2018/11/09 12:00.000Z",
                },
                {
                    id : 3,
                    note: "Note test 3",
                    tag: [
                        {
                            id: 1,
                            task: "Taxes",
                            dueDate: "2019/11/09 12:00.000Z",
                            isActive: 1
                        }
                    ],
                    privacyType: "email",
                    isStarred: 0,
                    createdBy: [
                        {
                            id: 1,
                            firstname: "User",
                            lastName: "2"
                        },
                    ],
                    comments: [
                        {
                            id: 1,
                            message: "Lorem Ipsum",
                            users: [
                                {
                                    id: 1,
                                    firstName: "Mickael",
                                    lastName: "Cardoso"
                                }
                            ]
                        },
                        {
                            id: 2,
                            message: "@mickael this is noted",
                            users: [
                                {
                                    id: 2,
                                    firstName: "User",
                                    lastName: "2"
                                }
                            ]
                        },
                    ],
                    dateAdded: "2018/11/09 12:00.000Z",
                    dateUpdated: "2018/11/09 12:00.000Z",
                }
            ]
            dispatch({type:"SET_NOTES_LIST", list: data})

            dispatch({type:"SET_NOTES_LOADING", Loading: ""});
        }, 3000)
    }

    openDetail(data){
        const { dispatch } = this.props
        dispatch({ type: "SET_NOTES_SELECTED", Selected: data })
        dispatch({ type: "SET_NOTES_FORM_ACTIVE", FormActive: "View" })
    }

    renderStatus(data) {
        const { isActive, dueDate } = { ...data };
        const dueDateMoment = moment(dueDate);
        const currentDateMoment = moment(new Date());
        let taskStatus = 0;
        let statusColor = "#000";

        if (dueDateMoment.isBefore(currentDateMoment, 'day') && data.status != 'Completed') {
            taskStatus = 2
        } else if (dueDateMoment.isSame(currentDateMoment, 'day') && data.status != 'Completed') {
            taskStatus = 1
        }

        if (isActive == 0) {
        } else if (taskStatus == 0) {
            statusColor = "#27ae60"
        } else if (taskStatus == 1) {
            statusColor = "#f39c12"
        } else if (taskStatus == 2) {
            statusColor = "#c0392b"
        }

        return statusColor;
    }

    renderPrivacy(privacy){
        let icon = "fa-users"; // public by default
        if ( privacy === "email" ) {
            icon = "fa-envelope";
        } else if ( privacy === "linked" ) {
            icon = "fa-link";
        } else if ( privacy === "private" ) {
            icon = "fa-locked";
        }
        return icon
    }

    render() {
        const { notes, dispatch } = this.props;
        const currentPage = (typeof notes.Count.current_page != "undefined") ? notes.Count.current_page : 1;
        const lastPage = (typeof notes.Count.last_page != "undefined") ? notes.Count.last_page : 1;
        const notesList = notes.List;

        return (
            <div class="pd10">
                <table id="dataTable" class="table responsive-table mt30">
                    <tbody>
                        { 
                            notesList.map((e)=>{
                                return <tr style={{cursor:"pointer",background:(notes.Selected.id === e.id)?"#f5f5f5":"transparent"}} onClick={() => this.openDetail(e)}>
                                            <td><span class="fa fa-star-o"></span></td>
                                            <td class="text-left">
                                                <div>
                                                    <h5>{e.note}</h5>
                                                    <label style={{fontWeight:"normal"}}>{moment(e.dateAdded).format("MM/DD/YYYY hh:mm")}</label>
                                                    <div style={{float:"right",marginTop:"-30px"}}>
                                                        {
                                                            (e.tag.map((f)=>{
                                                                const color = this.renderStatus(f);
                                                                return <span class="label" style={{margin: "5px", background: color }}>{f.task}</span>
                                                            }))
                                                        }
                                                        <span className="fa fa-ellipsis-h"></span>
                                                    </div>
                                                    <div style={{float:"right"}}>
                                                        <span className={`fa ${this.renderPrivacy(e.privacyType)}`} ></span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td class="text-center">
                                            </td>
                                        </tr>
                            })
                        }
                    </tbody>
                </table>
                <div class="text-center">
                    {
                        (notes.Loading == "RETRIEVING") && <Loading />
                    }
                    {
                        (currentPage != lastPage) && <a onClick={() => this.getNextResult()}>Load More Task</a>
                    }
                    {
                        (notesList.length == 0 && notes.Loading != "RETRIEVING") && <p>No Records Found</p>
                    }
                </div>
            </div>
        );
    }
}