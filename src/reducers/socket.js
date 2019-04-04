
import io from 'socket.io-client';
const socket = io('ws://ui-cloudcfo.volenday.com', {transports: ['websocket']});

export default function reducer(state={
        container : socket
    },action){
        return state;
}