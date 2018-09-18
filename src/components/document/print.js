import React from "react"
import { connect } from "react-redux"

@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
    }
})

export default class PrintComponent extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        let { document } = this.props;
        return (
                <div style={{display : 'none'}}>
                    <iframe id="printDocument" src={document.DocumentToPrint}></iframe>
                </div>
        )
    }
}