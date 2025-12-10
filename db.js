// Database configuration for NeDB
const path = require('path');
const Datastore = require('nedb');

// Database file paths
const dbPath = path.join(__dirname, 'data');

// Create database instances
const dbs = {
    users: new Datastore({ filename: path.join(dbPath, 'users.db'), autoload: true }),
    hotels: new Datastore({ filename: path.join(dbPath, 'hotels.db'), autoload: true }),
    ngos: new Datastore({ filename: path.join(dbPath, 'ngos.db'), autoload: true }),
    foodDonations: new Datastore({ filename: path.join(dbPath, 'foodDonations.db'), autoload: true }),
    wasteReports: new Datastore({ filename: path.join(dbPath, 'wasteReports.db'), autoload: true }),
    notifications: new Datastore({ filename: path.join(dbPath, 'notifications.db'), autoload: true })
};

// Create indexes for better query performance
Object.values(dbs).forEach(db => {
    db.ensureIndex({ fieldName: 'createdAt' });
    db.ensureIndex({ fieldName: 'updatedAt' });
});

// Users collection indexes
dbs.users.ensureIndex({ fieldName: 'email', unique: true });
dbs.users.ensureIndex({ fieldName: 'phone', sparse: true });

// Food donations indexes
dbs.foodDonations.ensureIndex({ fieldName: 'hotelId' });
dbs.foodDonations.ensureIndex({ fieldName: 'status' });

dbs.hotels.ensureIndex({ fieldName: 'email', unique: true });
dbs.ngos.ensureIndex({ fieldName: 'email', unique: true });

module.exports = dbs;
