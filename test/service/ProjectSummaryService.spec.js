require('dotenv').config();
const projectSerivce = require('../../service/ProjectSummaryService');

describe('ProjectSummaryService', () => {

    it('should list projects', async (done) => {
        // const results = await projectSerivce.listProjects(6, false, 1, 1, 0);

        // console.log(JSON.stringify(results[0]));

        // const firstResult = results[0];

        // expect(firstResult).toBeDefined();
        // expect(firstResult.id).toBe(89);
        // expect(firstResult.isDeleted).toEqual(0);
        // expect(firstResult.isActive).toEqual(1);
        // expect(firstResult.project).toEqual('117 KL');
        // expect(firstResult.type.type).toEqual('Client');
        // expect(firstResult.numberOfTasks).toBe(181);
        // expect(firstResult.newDocuments).toBe(2);

        /* FOR ACTIVE MONTH COMPLETION RATE COLUMN */

        // /* TASK DUE TODAY */
        // expect(firstResult.completion_rate.tasks_due_today.value).toBe(5.555555555555555);
        // expect(firstResult.completion_rate.tasks_due_today.color).toEqual('#f6dc64');
        // expect(firstResult.completion_rate.tasks_due_today.count).toBe(2);
        //
        // /* TASK FOR APPROVAL */
        // expect(firstResult.completion_rate.tasks_for_approval.value).toBe(0);
        // expect(firstResult.completion_rate.tasks_for_approval.color).toEqual('#ff754a');
        // expect(firstResult.completion_rate.tasks_for_approval.count).toBe(0);
        //
        // /* DELAYED TASK */
        // expect(firstResult.completion_rate.delayed_task.value).toBe(55.55555555555556);
        // expect(firstResult.completion_rate.delayed_task.color).toEqual('#f9003b');
        // expect(firstResult.completion_rate.delayed_task.count).toBe(20);
        //
        // /* COMPLETED TASK */
        // expect(firstResult.completion_rate.completed.value).toBe(22.22222222222222);
        // expect(firstResult.completion_rate.completed.color).toEqual('#00e589');
        // expect(firstResult.completion_rate.completed.count).toBe(8);

        done();

    });

});