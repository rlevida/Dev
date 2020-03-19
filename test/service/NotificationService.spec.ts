require('dotenv').config();
const notificationService = require('../../service/NotificationService');

describe('NotificationService', () => {

    it('should allow pushing a notification onto the queue', async (done) => {

        notificationService.enqueue('MY_TOPIC', {message: 'hello'});
        expect(notificationService.notes.length).toBe(1);
        done();

    });

});
