exports.get = {
    index: async (req, cb) => {
        cb({status: true, data: {message: 'hello'}});
    }
};
