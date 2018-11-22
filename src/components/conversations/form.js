import React from "react";
import _ from 'lodash';
import { connect } from "react-redux";

@connect((store) => {
    return {
        socket: store.socket.container,
        notes: store.notes,
    }
})

export default class FormComponent extends React.Component {

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
            icon = "fa-lock";
        }
        return icon
    }

    render() {
        const { notes } = { ...this.props }
        const data = notes.Selected;
        console.log(data);
        return (
            <div style={{ background:"#f5f5f5", padding: "10px", }}>
                <br />
                <br />
                <h5>{data.note}</h5>
                <span style={{float:"right",padding:"5px",}} class="fa fa-ellipsis-h"></span>
                <span style={{float:"right",padding:"5px",}} className={`fa ${this.renderPrivacy(data.privacyType)}`} ></span>
                {
                    (data.tag.map((f)=>{
                        const color = this.renderStatus(f.tagTask);
                        return <span class="label" style={{margin: "5px", background: color }}>{f.tagTask.task}</span>
                    }))
                }<span class="fa fa-pencil"></span>
                <hr />
                { data.comments.length == 0 && 
                    <div>No Comment</div>
                }
                {
                    data.comments.map((e)=>{
                        return <div>
                                    <div>
                                        <span>{`${e.users.firstName} ${e.users.lastName}`}</span>{'     '}<span>{moment(e.dateAdded).format("MM/DD/YYYY hh:mm")}</span>
                                        <span style={{float:"right",padding:"5px",}} class="fa fa-ellipsis-h"></span>
                                        <br />
                                        <br />
                                        <span>{e.comment}</span>
                                    </div>
                                    <hr />
                                </div>
                    })
                }
                <textarea style={{width: "100%"}} row="5" placeHolder="Edit to respond"></textarea>
            </div>
        )
    }
}