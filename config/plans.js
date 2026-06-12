const PLAN_DETAILS = {

    Free: {
        storageLimit: 1024 * 1024 * 5, //1 GB
        maxUsers: 10
    },

    Pro: {
        storageLimit: 10 * 1024 * 1024 * 1024, // 10 GB
        maxUsers: 50
    },

    Enterprise: {
        storageLimit: Infinity,
        maxUsers: Infinity
    }
};

module.exports = PLAN_DETAILS;