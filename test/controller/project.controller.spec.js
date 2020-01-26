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

    it('should foobar', async () => {
        const result = await request(server)
            .get('/api/v2project')
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

        console.log(JSON.stringify(result.body));
    });

    // it('should return project details for admin user for Projects page', async (done) => {

    //     // /api/project?page=1&userId=1&userRole=1&isActive=1&isDeleted=0&typeId=1&projectStatus=Active&hasMembers=1
    //     const result = await request(server)
    //         .get('/api/project')
    //         .query({
    //             page: 1,
    //             typeId: 1,
    //             isActive: 1,
    //             isDeleted: 0,
    //             dueDate: '2020-01-24',
    //             userId: 6,
    //             userRole: 1,
    //             projectStatus: 'Active',
    //             hasMembers: 1
    //         })
    //         .set('Cookie', 'app.sid=4LCk5fxEkKgQG47vK6pR9e3G6ao1wsbUavSkQhZEXAtg; connect.sid=s%3Alw1lkeDe-sJrNPnERCwBAAGV4ZkTggbM.Qv8g45aMVfzyREDMrVha10AXogFxcsKVFBbsx0WCO8A; io=AFYVOvmms-YNvlSYAAAE')
    //         .expect(200);

    //     const firstResult = result.body.result[0];

    //     expect(firstResult).toBeDefined();
    //     expect(firstResult.id).toBe(89);
    //     expect(firstResult.isDeleted).toEqual(0);
    //     expect(firstResult.isActive).toEqual(1);
    //     expect(firstResult.project).toEqual('117 KL');
    //     expect(firstResult.type.type).toEqual('Client');
    //     expect(firstResult.dateUpdated).toEqual('2020-01-13T08:11:30.000Z');
    //     expect(firstResult.numberOfTasks).toBe(36);
    //     expect(firstResult.projectManagerId).toBe(59)

    //     /* FOR WORKSTREAM COLUMN */
    //     // expect(firstResult.workstream).toBe(6) THIS SHOULD BE A COUNT OF WORKSTREAM NOT AN ARRAY ( HOW WE USE IN FRONTEND firstResult.workstream.length )

    //     /* MEMBERS COLUMN */

    //     const firstResultMember = firstResult.members[0];

    //     expect(firstResultMember.id).toBe(6);
    //     expect(firstResultMember.firstName).toEqual('Mickael');
    //     expect(firstResultMember.lastName).toEqual('Cardoso Das Neves');
    //     expect(firstResultMember.avatar).toEqual('https://s3-ap-southeast-1.amazonaws.com/cloud-cfo/production/profile_pictures/211ae7b068375410e05ab4628ce5af8b461c6958cloud_cfo_36.png');
    //     expect(firstResultMember.emailAddress).toEqual('mickael@cloudcfo.ph')

    //     // const firstResultTeam = firstResult.team[0] EMPTY VALUE

    //     /* FOR COMPLETION COLUMN */

    //     /* TASK DUE TODAY */
    //     expect(firstResult.completion_rate.tasks_due_today.value).toBe(5.555555555555555);
    //     expect(firstResult.completion_rate.tasks_due_today.color).toEqual('#f6dc64');
    //     expect(firstResult.completion_rate.tasks_due_today.count).toBe(2);

    //     /* TASK FOR APPROVAL */
    //     expect(firstResult.completion_rate.tasks_for_approval.value).toBe(0);
    //     expect(firstResult.completion_rate.tasks_for_approval.color).toEqual('#ff754a');
    //     expect(firstResult.completion_rate.tasks_for_approval.count).toBe(0);

    //     /* DELAYED TASK */
    //     expect(firstResult.completion_rate.delayed_task.value).toBe(55.55555555555556);
    //     expect(firstResult.completion_rate.delayed_task.color).toEqual('#f9003b');
    //     expect(firstResult.completion_rate.delayed_task.count).toBe(20);

    //     /* COMPLETED TASK */
    //     expect(firstResult.completion_rate.completed.value).toBe(22.22222222222222);
    //     expect(firstResult.completion_rate.completed.color).toEqual('#00e589');
    //     expect(firstResult.completion_rate.completed.count).toBe(8);

    //     done();

    // }, 15000);

});