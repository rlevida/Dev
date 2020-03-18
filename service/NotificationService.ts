import { Notification } from '../models/Notification';
import { CronJob } from 'cron';

const app = require('../server');
const io = require('socket.io-client');

/**
 * Serves to batch notifications together, so that the frequency is not overwhelming. Stores enqueued notifications
 * together in an outbox
 */
class NotificationService {

    private notes: Notification[] = [];
    private scheduler: CronJob;
    private socketIo: any;

    constructor(readonly cronTab: string) {
        this.initIo();
        this.scheduler = new CronJob({
            cronTime: this.cronTab,
            onTick: async () => {
                try {
                    await this.postFromOutbox();
                } catch (error) {
                    console.error(`Posting notifications failed: ${error}`);
                }
            },
            start: true
        });
    }

    enqueue(topic, message) {
        console.log(`Enqueue on topic: ${topic} with message: ${JSON.stringify(message)}`);
        const notification = new Notification(topic, message);
        this.notes.push(notification);
    }

    postFromOutbox() {
        console.log(`Posting ${this.notes.length} notifications`);
        this.notes.forEach(note => {
            this.socketIo.emit(note.topic, note.message);
        });
        this.notes = [];
    }

    private initIo() {
        this.socketIo = io('http://localhost:3008', {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 99999
        });
    }
}

module.exports = new NotificationService(process.env.NOTIFIER_CRONTAB || '*/60 * * * * *');
