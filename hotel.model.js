const { hotels } = require('../database/db');
const { v4: uuidv4 } = require('uuid');

class Hotel {
    // Create a new hotel
    static create(hotelData, userId) {
        return new Promise((resolve, reject) => {
            const hotel = {
                _id: uuidv4(),
                name: hotelData.name,
                description: hotelData.description,
                address: hotelData.address,
                city: hotelData.city,
                state: hotelData.state,
                country: hotelData.country,
                pincode: hotelData.pincode,
                phone: hotelData.phone,
                email: hotelData.email,
                website: hotelData.website,
                cuisineType: hotelData.cuisineType || [],
                capacity: hotelData.capacity,
                ownerId: userId,
                isActive: true,
                location: {
                    type: 'Point',
                    coordinates: [
                        parseFloat(hotelData.longitude) || 0,
                        parseFloat(hotelData.latitude) || 0
                    ]
                },
                openingHours: hotelData.openingHours || {},
                images: hotelData.images || [],
                documents: hotelData.documents || [],
                rating: 0,
                totalRatings: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            hotels.insert(hotel, (err, newHotel) => {
                if (err) return reject(err);
                resolve(newHotel);
            });
        });
    }

    // Find hotel by ID
    static findById(id) {
        return new Promise((resolve, reject) => {
            hotels.findOne({ _id: id, isActive: true }, (err, hotel) => {
                if (err) return reject(err);
                resolve(hotel);
            });
        });
    }

    // Find hotels by owner
    static findByOwner(ownerId) {
        return new Promise((resolve, reject) => {
            hotels.find({ ownerId, isActive: true }, (err, hotels) => {
                if (err) return reject(err);
                resolve(hotels);
            });
        });
    }

    // Update hotel
    static update(id, updateData) {
        return new Promise((resolve, reject) => {
            updateData.updatedAt = new Date();
            
            hotels.update(
                { _id: id },
                { $set: updateData },
                { returnUpdatedDocs: true },
                (err, numAffected, updatedHotel) => {
                    if (err) return reject(err);
                    resolve(updatedHotel);
                }
            );
        });
    }

    // Delete hotel (soft delete)
    static delete(id) {
        return this.update(id, { isActive: false });
    }

    // Search hotels by location and filters
    static search({ latitude, longitude, radius = 10000, cuisineType, minRating, limit = 10, page = 1 }) {
        return new Promise((resolve, reject) => {
            const query = { isActive: true };
            
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
            
            // Add cuisine type filter
            if (cuisineType) {
                query.cuisineType = { $in: Array.isArray(cuisineType) ? cuisineType : [cuisineType] };
            }
            
            // Add rating filter
            if (minRating) {
                query.rating = { $gte: parseFloat(minRating) };
            }
            
            const skip = (page - 1) * limit;
            
            // Execute query with pagination
            hotels.find(query)
                .sort({ rating: -1 })
                .skip(skip)
                .limit(limit)
                .exec((err, results) => {
                    if (err) return reject(err);
                    
                    // Get total count for pagination
                    hotels.count(query, (err, total) => {
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
}

module.exports = Hotel;
