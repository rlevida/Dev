
import io from 'socket.io-client';
const socket = io();

export default function reducer(state={
        container : socket
    },action){
        return state;
}