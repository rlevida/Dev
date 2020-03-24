import { Notification } from '../models/Notification';
import { CronJob } from 'cron';
const io = require('socket.io-client');

/**
 * Serves to batch notifications together, so that the frequency is not overwhelming. Stores enqueued notifications
 * together in an outbox
 */
class NotificationService {

    private _notes: Notification[] = [];
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

    get notes(): Notification[] {
        return this._notes;
    }

    enqueue(topic, message) {
        console.log(`Enqueue on topic: ${topic} with message: ${JSON.stringify(message)}`);
        const notification = new Notification(topic, message);
        this._notes.push(notification);
    }

    postFromOutbox() {
        console.log(`Posting ${this._notes.length} notifications`);
        this._notes.forEach(note => {
            this.socketIo.emit(note.topic, note.message);
        });
        this._notes = [];
    }

    private initIo() {
        const siteUrl = this.siteUrl();
        console.log(`Site url for socket io: ${siteUrl}`);
        this.socketIo = io(siteUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 99999
        });
    }

    private siteUrl(): string {
        const environment =  process.env.NODE_ENV || "development";
        if (environment === "development") {
            return "//localhost:3008/";
        }
        if (environment === "staging") {
            return "//ui-cloudcfo.mobbizapp.com/";
        }

        if (environment === "production") {
            return "//app.cloudcfo.ph/";
        }
    }
}

module.exports = new NotificationService(process.env.NOTIFIER_CRONTAB || '*/30 * * * * *');
