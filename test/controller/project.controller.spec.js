const server = require('../../server');
const request = require('supertest');

describe('project controller', () => {

    it('should return project details for admin user for Project Summary page', async (done) => {
        const result = await request(server)
            .get('/api/project')
            .query({
                page: 1,
                typeId: '',
                isActive: 1,
                isDeleted: 0,
                dueDate: '2020-01-24',
                userId: 6,
                userRole: 1
            })
            .set('Cookie', 'app.sid=53oN3kha3mBMJ4G8vCnoQpTzmJ6wQJ8zpVcE7w4M9aga; connect.sid=s%3A4VQCVHzGvvs3Xe6UQTWQiSNPtcGksVY1.cwhD8yRtJpTe51oGvxGvX6tHi6c9GegAQG8eSYG3LFI; io=NWJqOURkkUQImGrQAAAD')
            .expect(200);

        expect(result.body.result).toHaveLength(25);
        const firstResult = result.body.result[0];

        expect(firstResult).toBeDefined();
        expect(firstResult.id).toBe(89);
        expect(firstResult.isDeleted).toEqual(0);
        expect(firstResult.isActive).toEqual(1);
        expect(firstResult.project).toEqual('117 KL');
        expect(firstResult.type.type).toEqual('Client');
        expect(firstResult.numberOfTasks).toBe(36);
        expect(firstResult.newDocuments).toBe(2);

        /* FOR ACTIVE MONTH COMPLETION RATE COLUMN */

        /* TASK DUE TODAY */
        expect(firstResult.completion_rate.tasks_due_today.value).toBe(5.555555555555555);
        expect(firstResult.completion_rate.tasks_due_today.color).toEqual('#f6dc64');
        expect(firstResult.completion_rate.tasks_due_today.count).toBe(2);

        /* TASK FOR APPROVAL */
        expect(firstResult.completion_rate.tasks_for_approval.value).toBe(0);
        expect(firstResult.completion_rate.tasks_for_approval.color).toEqual('#ff754a');
        expect(firstResult.completion_rate.tasks_for_approval.count).toBe(0);

        /* DELAYED TASK */
        expect(firstResult.completion_rate.delayed_task.value).toBe(55.55555555555556);
        expect(firstResult.completion_rate.delayed_task.color).toEqual('#f9003b');
        expect(firstResult.completion_rate.delayed_task.count).toBe(20);

        /* COMPLETED TASK */
        expect(firstResult.completion_rate.completed.value).toBe(22.22222222222222);
        expect(firstResult.completion_rate.completed.color).toEqual('#00e589');
        expect(firstResult.completion_rate.completed.count).toBe(8);

        done();

    }, 15000);

    it('should return project details using new endpoint ', async () => {
        const result = await request(server)
            .get('/api/v2project')
            .query({
                page: 2,
                typeId: '',
                isActive: 1,
                isDeleted: 0,
                dueDate: '2020-01-24',
                userId: 6,
                userRole: 1
            })
            .set('Cookie', 'app.sid=53oN3kha3mBMJ4G8vCnoQpTzmJ6wQJ8zpVcE7w4M9aga; connect.sid=s%3A4VQCVHzGvvs3Xe6UQTWQiSNPtcGksVY1.cwhD8yRtJpTe51oGvxGvX6tHi6c9GegAQG8eSYG3LFI; io=NWJqOURkkUQImGrQAAAD')
            .expect(200);

        expect(result.body.result).toHaveLength(25);
        console.log(JSON.stringify(result.body));
    });

});