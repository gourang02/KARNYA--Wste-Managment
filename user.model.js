const { users } = require('../database/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { generateAuthToken } = require('../utils/auth');

class User {
    // Create a new user
    static async create(userData) {
        try {
            // Check if user already exists
            const existingUser = await this.findByEmail(userData.email);
            if (existingUser) {
                throw new Error('User with this email already exists');
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(userData.password, salt);

            // Create user object
            const user = {
                _id: uuidv4(),
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                password: hashedPassword,
                phone: userData.phone,
                userType: userData.userType || 'individual',
                isVerified: false,
                verificationToken: uuidv4(),
                resetPasswordToken: null,
                resetPasswordExpires: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Insert into database
            return new Promise((resolve, reject) => {
                users.insert(user, (err, newUser) => {
                    if (err) return reject(err);
                    // Don't return the password hash
                    const { password, ...userWithoutPassword } = newUser;
                    resolve(userWithoutPassword);
                });
            });
        } catch (error) {
            throw error;
        }
    }

    // Find user by email
    static findByEmail(email) {
        return new Promise((resolve, reject) => {
            users.findOne({ email }, (err, user) => {
                if (err) return reject(err);
                resolve(user);
            });
        });
    }

    // Find user by ID
    static findById(id) {
        return new Promise((resolve, reject) => {
            users.findOne({ _id: id }, (err, user) => {
                if (err) return reject(err);
                if (user) {
                    const { password, ...userWithoutPassword } = user;
                    resolve(userWithoutPassword);
                } else {
                    resolve(null);
                }
            });
        });
    }

    // Verify user email
    static async verifyEmail(token) {
        return new Promise((resolve, reject) => {
            users.findOneAndUpdate(
                { verificationToken: token },
                { 
                    $set: { 
                        isVerified: true,
                        verificationToken: null,
                        updatedAt: new Date() 
                    } 
                },
                { returnUpdatedDocs: true },
                (err, numAffected, updatedUser) => {
                    if (err) return reject(err);
                    if (!updatedUser) return resolve(null);
                    const { password, ...userWithoutPassword } = updatedUser;
                    resolve(userWithoutPassword);
                }
            );
        });
    }

    // Generate password reset token
    static async generatePasswordResetToken(email) {
        const token = uuidv4();
        const expires = new Date();
        expires.setHours(expires.getHours() + 1); // Token expires in 1 hour

        return new Promise((resolve, reject) => {
            users.update(
                { email },
                { 
                    $set: { 
                        resetPasswordToken: token,
                        resetPasswordExpires: expires,
                        updatedAt: new Date() 
                    } 
                },
                { returnUpdatedDocs: true },
                (err, numAffected, affectedDocuments) => {
                    if (err) return reject(err);
                    if (numAffected === 0) return resolve(null);
                    resolve(token);
                }
            );
        });
    }

    // Reset password
    static async resetPassword(token, newPassword) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        return new Promise((resolve, reject) => {
            users.update(
                { 
                    resetPasswordToken: token,
                    resetPasswordExpires: { $gt: new Date() }
                },
                { 
                    $set: { 
                        password: hashedPassword,
                        resetPasswordToken: null,
                        resetPasswordExpires: null,
                        updatedAt: new Date() 
                    } 
                },
                { returnUpdatedDocs: true },
                (err, numAffected, affectedDocuments) => {
                    if (err) return reject(err);
                    if (numAffected === 0) return resolve(false);
                    resolve(true);
                }
            );
        });
    }

    // Update user profile
    static async updateProfile(userId, updateData) {
        const updates = { ...updateData, updatedAt: new Date() };
        
        // Don't allow updating sensitive fields this way
        delete updates.password;
        delete updates.email;
        delete updates.isVerified;
        
        return new Promise((resolve, reject) => {
            users.update(
                { _id: userId },
                { $set: updates },
                { returnUpdatedDocs: true },
                (err, numAffected, updatedUser) => {
                    if (err) return reject(err);
                    if (!updatedUser) return resolve(null);
                    const { password, ...userWithoutPassword } = updatedUser;
                    resolve(userWithoutPassword);
                }
            );
        });
    }

    // Authenticate user
    static async authenticate(email, password) {
        try {
            const user = await this.findByEmail(email);
            if (!user) return null;
            
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return null;
            
            // Don't return the password hash
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = User;
