require('dotenv').config();
const notificationService = require('../../service/NotificationService');

describe('NotificationService', () => {

    it('should allow pushing a notification onto the queue', async (done) => {

        notificationService.enqueue('MY_TOPIC', {message: 'hello'});
        expect(notificationService.messages.length).toBe(1);
        setTimeout(() => {
            done();
        }, 30000)


    }, 60000);

});
