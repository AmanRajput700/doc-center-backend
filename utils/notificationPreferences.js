module.exports = {
    emailNotifications: [
        {
            name: 'emailOnUpload',
            title: 'Email on Upload',
            description: 'Receive an email each time a new file is uploaded.'
        },
        {
            name: 'weeklyUsageReport',
            title: 'Weekly Usage Report',
            description: 'Get a summary of activity every Saturday night.'
        },
        {
            name: 'securityAlerts',
            title: 'Security Alerts',
            description: 'Get notified of any security-related events.'
        },
        {
            name: 'apiLimitWarnings',
            title: 'API Limit Warnings',
            description: 'Receive alerts when approaching API usage limits.'
        }
    ],

    // inAppNotifications: [
    //     {
    //         name: 'newFileComments',
    //         title: 'New File Comments',
    //         description: "Get notified when someone comments on a file you've uploaded."
    //     },
    //     {
    //         name: 'roleChanges',
    //         title: 'Role Changes',
    //         description: 'Receive updates when your role or permissions change.'
    //     },
    //     {
    //         name: 'storageWarnings',
    //         title: 'Storage Warnings',
    //         description: "Get alerts when you're approaching your storage limits."
    //     },
    //     {
    //         name: 'systemAnnouncements',
    //         title: 'System Announcements',
    //         description: 'Stay informed about important system updates and announcements.'
    //     }
    // ]
};