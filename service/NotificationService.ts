import { Notification} from '../models/Notification';
import { CronJob } from 'cron';

/**
 * Serves to batch notifications together, so that the frequency is not overwhelming. Stores enqueued notifications
 * together in an outbox
 */
class NotificationService {

    readonly messages = [];
    private scheduler: CronJob;

    constructor(readonly cronTab: string) {
        this.scheduler = new CronJob({
            cronTime: this.cronTab,
            onTick: async () => {
                try {
                    await this.postFromOutbox();
                } catch (error) {
                    console.error(`Posting notifications failed: ${error}`)
                }
            },
            start: true,
        });
    }

    enqueue(topic, message) {
        const notification = new Notification(topic, message);
        this.messages.push(notification);
    }

    postFromOutbox() {
        console.log(`Posting all the msgs`);
    }
}

module.exports = new NotificationService(process.env.NOTIFIER_CRONTAB || '*/5 * * * * *');
