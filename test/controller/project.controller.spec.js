const server = require('../../server');
const request = require('supertest');

describe('project controller', () => {

    it('should return project details for admin user', async (done) => {
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
            .set('Cookie', 'app.sid=53oN3kha3mBMJ4G8vCnoQpTzmJ6wQJ8zpVcE7w4M9aga; connect.sid=s%3A9vv5sN_oUZahrB94zl9ntl_n3N8gVBH0.EwHMSis2TnPVhWzJ%2B1VcaTFsfj3Kia%2FblIzvfAPUNlE; io=fA2pc_XwBjAGpCCgAAA-')
            .expect(200);

        console.log(JSON.stringify(result.body));
        done();


    }, 15000);

});