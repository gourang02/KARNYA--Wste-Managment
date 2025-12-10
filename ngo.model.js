const { ngos } = require('../database/db');
const { v4: uuidv4 } = require('uuid');

class Ngo {
    // Create a new NGO
    static create(ngoData, userId) {
        return new Promise((resolve, reject) => {
            const ngo = {
                _id: uuidv4(),
                name: ngoData.name,
                description: ngoData.description,
                registrationNumber: ngoData.registrationNumber,
                address: ngoData.address,
                city: ngoData.city,
                state: ngoData.state,
                country: ngoData.country,
                pincode: ngoData.pincode,
                phone: ngoData.phone,
                email: ngoData.email,
                website: ngoData.website,
                focusAreas: ngoData.focusAreas || [],
                beneficiaries: ngoData.beneficiaries || 0,
                adminId: userId,
                isVerified: false,
                isActive: true,
                location: {
                    type: 'Point',
                    coordinates: [
                        parseFloat(ngoData.longitude) || 0,
                        parseFloat(ngoData.latitude) || 0
                    ]
                },
                images: ngoData.images || [],
                documents: ngoData.documents || [],
                rating: 0,
                totalRatings: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            ngos.insert(ngo, (err, newNgo) => {
                if (err) return reject(err);
                resolve(newNgo);
            });
        });
    }

    // Find NGO by ID
    static findById(id) {
        return new Promise((resolve, reject) => {
            ngos.findOne({ _id: id, isActive: true }, (err, ngo) => {
                if (err) return reject(err);
                resolve(ngo);
            });
        });
    }

    // Find NGOs by admin
    static findByAdmin(adminId) {
        return new Promise((resolve, reject) => {
            ngos.find({ adminId, isActive: true }, (err, ngosList) => {
                if (err) return reject(err);
                resolve(ngosList);
            });
        });
    }

    // Update NGO
    static update(id, updateData) {
        return new Promise((resolve, reject) => {
            updateData.updatedAt = new Date();
            
            ngos.update(
                { _id: id },
                { $set: updateData },
                { returnUpdatedDocs: true },
                (err, numAffected, updatedNgo) => {
                    if (err) return reject(err);
                    resolve(updatedNgo);
                }
            );
        });
    }

    // Delete NGO (soft delete)
    static delete(id) {
        return this.update(id, { isActive: false });
    }

    // Search NGOs by location and filters
    static search({ latitude, longitude, radius = 10000, focusArea, minRating, limit = 10, page = 1 }) {
        return new Promise((resolve, reject) => {
            const query = { isActive: true, isVerified: true };
            
            // Add location filter
            if (latitude && longitude) {
                query.location = {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [parseFloat(longitude), parseFloat(latitude)]
                        },
                        $maxDistance: parseInt(radius)
                    }
                };
            }
            
            // Add focus area filter
            if (focusArea) {
                query.focusAreas = { $in: Array.isArray(focusArea) ? focusArea : [focusArea] };
            }
            
            // Add rating filter
            if (minRating) {
                query.rating = { $gte: parseFloat(minRating) };
            }
            
            const skip = (page - 1) * limit;
            
            // Execute query with pagination
            ngos.find(query)
                .sort({ rating: -1 })
                .skip(skip)
                .limit(limit)
                .exec((err, results) => {
                    if (err) return reject(err);
                    
                    // Get total count for pagination
                    ngos.count(query, (err, total) => {
                        if (err) return reject(err);
                        
                        resolve({
                            data: results,
                            pagination: {
                                total,
                                page,
                                totalPages: Math.ceil(total / limit),
                                limit
                            }
                        });
                    });
                });
        });
    }

    // Verify NGO (admin function)
    static verify(id) {
        return this.update(id, { isVerified: true });
    }
}

module.exports = Ngo;
