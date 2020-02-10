const server = require('../../server');
const request = require('supertest');

describe('project controller', () => {

    // it('should return project details for admin user for Project Summary page', async (done) => {
    //     const result = await request(server)
    //         .get('/api/project')
    //         .query({
    //             page: 1,
    //             typeId: 1,
    //             isActive: 1,
    //             isDeleted: 0,
    //             dueDate: '2020-01-24',
    //             userId: 6,
    //             userRole: 1
    //         })
    //         .set('Cookie', 'app.sid=4LCk5fxEkKgQG47vK6pR9e3G6ao1wsbUavSkQhZEXAtg; connect.sid=s%3AuGL0ZEdf2rMGRktgaOZ_dDkPEiEge--l.wxgLo4KXZYhWZFsAX8Hq27DYB3IoUOOVnhOEf4jFSbQ; io=1kPQxYVkQlUChPjFAAAF')
    //         .expect(200);

    //     expect(result.body.result).toHaveLength(25);
    //     const firstResult = result.body.result[0];

    //     expect(firstResult).toBeDefined();
    //     expect(firstResult.id).toBe(89);
    //     expect(firstResult.isDeleted).toEqual(0);
    //     expect(firstResult.isActive).toEqual(1);
    //     expect(firstResult.project).toEqual('117 KL');
    //     expect(firstResult.type.type).toEqual('Client');
    //     expect(firstResult.numberOfTasks).toBe(36);
    //     expect(firstResult.newDocuments).toBe(2);

    //     /* FOR ACTIVE MONTH COMPLETION RATE COLUMN */

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

    // it('should return project details using new endpoint ', async () => {
    //     const result = await request(server)
    //         .get('/api/v2project')
    //         .query({
    //             page: 1,
    //             typeId: 1,
    //             isActive: 1,
    //             isDeleted: 0,
    //             userId: 6,
    //             userRole: 1
    //         })
    //         .set('Cookie', 'app.sid=4LCk5fxEkKgQG47vK6pR9e3G6ao1wsbUavSkQhZEXAtg; connect.sid=s%3AuGL0ZEdf2rMGRktgaOZ_dDkPEiEge--l.wxgLo4KXZYhWZFsAX8Hq27DYB3IoUOOVnhOEf4jFSbQ; io=1kPQxYVkQlUChPjFAAAF')
    //         .expect(200);

    //     expect(result.body.result).toHaveLength(25);
    //     console.log(JSON.stringify(result.body.result[0]));
    // });

    // it('should return project details using new endpoint with project type private ', async (done) => {
    //     const result = await request(server)
    //         .get('/api/v2project')
    //         .query({
    //             page: 1,
    //             typeId: 3,
    //             isActive: 1,
    //             isDeleted: 0,
    //             userId: 6,
    //             userRole: 1
    //         })
    //         .set('Cookie', 'app.sid=4LCk5fxEkKgQG47vK6pR9e3G6ao1wsbUavSkQhZEXAtg; connect.sid=s%3AuGL0ZEdf2rMGRktgaOZ_dDkPEiEge--l.wxgLo4KXZYhWZFsAX8Hq27DYB3IoUOOVnhOEf4jFSbQ; io=1kPQxYVkQlUChPjFAAAF')
    //         .expect(200);

    //     expect(result.body.result).toHaveLength(6);
    //     console.log(JSON.stringify(result.body));
    //     done();
    // });

    // it('should return project details using new endpoint with member and team field ', async (done) => {
    //     const result = await request(server)
    //         .get('/api/v2project')
    //         .query({
    //             page: 3,
    //             typeId: 1,
    //             isActive: 1,
    //             isDeleted: 0,
    //             userId: 1,
    //             userRole: 1,
    //             hasMembers:1
    //         })
    //         .set('Cookie', 'app.sid=4LCk5fxEkKgQG47vK6pR9e3G6ao1wsbUavSkQhZEXAtg; connect.sid=s%3AuGL0ZEdf2rMGRktgaOZ_dDkPEiEge--l.wxgLo4KXZYhWZFsAX8Hq27DYB3IoUOOVnhOEf4jFSbQ; io=1kPQxYVkQlUChPjFAAAF')
    //         .expect(200);
    //     expect(result.body.result).toHaveLength(25);
    //     done()
    // });

    // it('should return projects have test in name', async (done) => {
    //     const result = await request(server)
    //         .get('/api/v2project')
    //         .query({
    //             page: 1,
    //             typeId: 1,
    //             isActive: 1,
    //             isDeleted: 0,
    //             userId: 1,
    //             userRole: 1,
    //             hasMembers: 1,
    //             project: 'test'
    //         })
    //         .set('Cookie', 'app.sid=4LCk5fxEkKgQG47vK6pR9e3G6ao1wsbUavSkQhZEXAtg; connect.sid=s%3AuGL0ZEdf2rMGRktgaOZ_dDkPEiEge--l.wxgLo4KXZYhWZFsAX8Hq27DYB3IoUOOVnhOEf4jFSbQ; io=1kPQxYVkQlUChPjFAAAF')
    //         .expect(200);
    //     expect(result.body.result).toHaveLength(4);
    //     done()
    // });

    // it('should return projects without delayed task', async (done) => {
    //     // GET /api/project?page=1&typeId=1&userId=6&userRole=1&hasMembers=1&projectProgress=On%20Time&isActive=1
    //     const result = await request(server)
    //         .get('/api/v2project')
    //         .query({
    //             page: 1,
    //             typeId: 1,
    //             isActive: 1,
    //             isDeleted: 0,
    //             userId: 1,
    //             userRole: 1,
    //             hasMembers: 1,
    //             projectProgress: 'On Time'
    //         })
    //         .set('Cookie', 'app.sid=4LCk5fxEkKgQG47vK6pR9e3G6ao1wsbUavSkQhZEXAtg; connect.sid=s%3AuGL0ZEdf2rMGRktgaOZ_dDkPEiEge--l.wxgLo4KXZYhWZFsAX8Hq27DYB3IoUOOVnhOEf4jFSbQ; io=1kPQxYVkQlUChPjFAAAF')
    //         .expect(200);
    //     const firstResult = result.body.result[0];
    //     expect(firstResult).toBeDefined();
    //     expect(firstResult.completion_rate.delayed_task.count).toBe(0);
    //     done();
    // });

    // it('should return projects with delayed task', async (done) => {
    //     const result = await request(server)
    //         .get('/api/v2project')
    //         .query({
    //             page: 1,
    //             typeId: 1,
    //             isActive: 1,
    //             isDeleted: 0,
    //             userId: 1,
    //             userRole: 1,
    //             hasMembers: 1,
    //             projectProgress: 'Issues'
    //         })
    //         .set('Cookie', 'app.sid=4LCk5fxEkKgQG47vK6pR9e3G6ao1wsbUavSkQhZEXAtg; connect.sid=s%3AuGL0ZEdf2rMGRktgaOZ_dDkPEiEge--l.wxgLo4KXZYhWZFsAX8Hq27DYB3IoUOOVnhOEf4jFSbQ; io=1kPQxYVkQlUChPjFAAAF')
    //         .expect(200);

    //     const firstResult = result.body.result[0];
    //     expect(firstResult).toBeDefined();
    //     expect(firstResult.completion_rate.delayed_task.count).toBeGreaterThan(0);
    //     done();
    // });

    // it('should return inactive projects', async (done) => {
    //     // GET /api/project?page=1&typeId=1&userId=6&userRole=1&hasMembers=1&projectProgress=On%20Time&isActive=1
    //     const result = await request(server)
    //         .get('/api/v2project')
    //         .query({
    //             page: 1,
    //             typeId: 1,
    //             isActive: 0,
    //             isDeleted: 0,
    //             userId: 1,
    //             userRole: 1,
    //             hasMembers: 1,
    //         })
    //         .set('Cookie', 'app.sid=4LCk5fxEkKgQG47vK6pR9e3G6ao1wsbUavSkQhZEXAtg; connect.sid=s%3AuGL0ZEdf2rMGRktgaOZ_dDkPEiEge--l.wxgLo4KXZYhWZFsAX8Hq27DYB3IoUOOVnhOEf4jFSbQ; io=1kPQxYVkQlUChPjFAAAF')
    //         .expect(200);

    //     const firstResult = result.body.result[0];
    //     expect(firstResult).toBeDefined();
    //     expect(firstResult.isActive).toBe(0);
    //     done()
    // });

    it('should return project details with delayed and due today count of task', async (done) => {
        const result = await request(server)
            .get('/api/v2project')
            .query({
                page: 1,
                typeId: 1,
                isActive: 1,
                isDeleted: 0,
                userId: 1,
                userRole: 1,
                hasMembers: 1,
                dueDate: '2020-01-30 16:00:00'
            })
            .set('Cookie', 'app.sid=4LCk5fxEkKgQG47vK6pR9e3G6ao1wsbUavSkQhZEXAtg; connect.sid=s%3AuGL0ZEdf2rMGRktgaOZ_dDkPEiEge--l.wxgLo4KXZYhWZFsAX8Hq27DYB3IoUOOVnhOEf4jFSbQ; io=1kPQxYVkQlUChPjFAAAF')
            .expect(200);

        const firstResult = result.body.result[0];
        expect(firstResult).toBeDefined();
        expect(firstResult.completion_rate.delayed_task.count).toBeGreaterThan(0);
        expect(firstResult.completion_rate.tasks_due_today.count).toBeGreaterThan(0);
        done()
    });

    // it('project controller for Projects page', async (done) => {
    //     const result = await request(server)
    //         .get('/api/project')
    //         .query({
    //             page: 1,
    //             typeId: 1,
    //             isActive: 1,
    //             isDeleted: 0,
    //             userId: 1,
    //             userRole: 1,
    //             hasMembers: 1,
    //             projectStatus:'Active'
    //         })
    //         .set('Cookie', 'app.sid=4LCk5fxEkKgQG47vK6pR9e3G6ao1wsbUavSkQhZEXAtg; connect.sid=s%3AF-dCHuuHclOX2KhD94TFY5zCbWdLp2Kp.VYq9%2FG7x6SKZMwk9teAg9R6lhApQ7GkGr0ZBrY3d%2Bv8; io=WGJIb9WRmpzQ1C1qAAAL')
    //         .expect(200);

    //     const firstResult = result.body.result[0];
    //     expect(firstResult).toBeDefined();
    //     expect(firstResult.id).toBe(89);
    //     expect(firstResult.project).toEqual('117 KL');
    //     expect(firstResult.workstream.length).toBe(6);
    //     expect(firstResult.type.type).toEqual('Client');
    //     expect(firstResult.isDeleted).toBe(0)

    //     expect(firstResult.members[0].id).toBe(6)
    //     expect(firstResult.members[0].firstName).toEqual('Mickael')
    //     expect(firstResult.members[0].lastName).toEqual('Cardoso Das Neves')
    //     expect(firstResult.members[0].avatar).toEqual('https://s3-ap-southeast-1.amazonaws.com/cloud-cfo/production/profile_pictures/211ae7b068375410e05ab4628ce5af8b461c6958cloud_cfo_36.png')
    //     expect(firstResult.members[0].emailAddress).toEqual('mickael@cloudcfo.ph')

    //     expect(firstResult.team.length).toBe(0);
    //     expect(firstResult.numberOfTasks).toBe(181)
    //     expect(firstResult.completion_rate.completed.count).toBe(114)

    //     done();
    // });

    it('should return projects with admin access', async (done) => {
        // GET /api/project?page=1&typeId=1&userId=6&userRole=1&hasMembers=1&projectProgress=On%20Time&isActive=1
        const result = await request(server)
            .get('/api/v2project')
            .query({
                page: 1,
                typeId: 1,
                isActive: 1,
                isDeleted: 0,
                userId: 1,
                userRole: 2,
            })
            .set('Cookie', 'app.sid=6RjchYV2k2AFkvmMt29LBhvhohKiJMzpyw9w7qPqTnwv; connect.sid=s%3A_NC1DyVkmb0bxom_C3b2hgBSlZNczTM6.oxC%2BcODgGaaYQEA183WotfJIxIJDmX0HI8Cixa23OQ4; io=RShglpq5sCuLhUUJAAAB')
            .expect(200);
            console.log(result.body.result.length)
        expect(result.body.result).toHaveLength(25);
        done();
    });
});